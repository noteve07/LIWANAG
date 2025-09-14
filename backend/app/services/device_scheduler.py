import asyncio
from datetime import datetime, timedelta
from typing import Optional

from core.database import supabase
from core.config import settings
from models.sensor_device import DeviceStatus


class DeviceScheduler:
    """Background scheduler for device management tasks"""
    
    def __init__(self, check_interval_minutes: int = 1, timeout_minutes: int = 1):
        self.check_interval_minutes = check_interval_minutes
        self.timeout_minutes = timeout_minutes
        self.is_running = False
        self._task: Optional[asyncio.Task] = None
    
    async def start(self):
        """Start the background scheduler"""
        if self.is_running:
            return
        
        self.is_running = True
        self._task = asyncio.create_task(self._scheduler_loop())
        print(f"✅ Device scheduler started - checking every {self.check_interval_minutes} minute(s)")
    
    async def stop(self):
        """Stop the background scheduler"""
        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        print("🛑 Device scheduler stopped")
    
    async def _scheduler_loop(self):
        """Main scheduler loop"""
        while self.is_running:
            try:
                await self._check_offline_devices()
                # wait for next check
                await asyncio.sleep(self.check_interval_minutes * 60)
            except Exception as e:
                print(f"❌ Scheduler error: {e}")
                await asyncio.sleep(30)  # wait 30 seconds before retry
    
    async def _check_offline_devices(self):
        """Check for devices that should be marked offline"""
        try:
            cutoff_time = datetime.now() - timedelta(minutes=self.timeout_minutes)
            
            # get all online devices
            all_online = supabase.table("sensor_devices").select("*").eq("status", DeviceStatus.ONLINE.value).execute()
            
            print(f"📡 Scheduler: Checking {len(all_online.data)} online device(s) for stale activity")
            
            # log all online devices with their last seen times and remaining time before timeout
            for device in all_online.data:
                device_last_seen = device['last_seen']
                try:
                    if isinstance(device_last_seen, str):
                        device_time = datetime.fromisoformat(device_last_seen.replace('Z', '+00:00'))
                        device_time = device_time.replace(tzinfo=None)
                    else:
                        device_time = device_last_seen
                    
                    time_diff = datetime.now() - device_time
                    minutes_ago = time_diff.total_seconds() / 60
                    
                    # calculate remaining time before timeout for this device
                    remaining_minutes = self.timeout_minutes - minutes_ago
                    
                    if remaining_minutes > 0:
                        print(f"🟢 Device {device['device_id']} ({device['name']}) - last seen {minutes_ago:.1f}min ago, {remaining_minutes:.1f}min until timeout")
                    else:
                        print(f"⚠️  Device {device['device_id']} ({device['name']}) - last seen {minutes_ago:.1f}min ago, OVERDUE by {abs(remaining_minutes):.1f}min")
                    
                except Exception as parse_error:
                    print(f"❌ Could not parse timestamp for device {device['device_id']}: {parse_error}")
            
            # check for stale devices
            stale_devices = []
            for device in all_online.data:
                device_last_seen = device['last_seen']
                try:
                    # parse the timestamp from database
                    if isinstance(device_last_seen, str):
                        # handle different timestamp formats from Supabase
                        device_time = datetime.fromisoformat(device_last_seen.replace('Z', '+00:00'))
                        device_time = device_time.replace(tzinfo=None)
                    else:
                        device_time = device_last_seen
                    
                    # calculate how long it's been stale
                    time_diff = datetime.now() - device_time
                    minutes_stale = time_diff.total_seconds() / 60
                    
                    # check if device is stale
                    if device_time < cutoff_time:
                        device['minutes_stale'] = minutes_stale
                        stale_devices.append(device)
                        print(f"⚠️  Device {device['device_id']} ({device['name']}) is STALE - no heartbeat for {minutes_stale:.1f} minutes")
                
                except Exception as parse_error:
                    print(f"❌ Could not parse timestamp for device {device['device_id']}: {parse_error}")
            
            # log the number of stale devices
            if len(stale_devices) > 0:
                print(f"🔴 Found {len(stale_devices)} stale device(s) to mark offline")
            
            # mark the stale devices as offline
            offline_count = 0
            for device in stale_devices:
                supabase.table("sensor_devices").update({
                    "status": DeviceStatus.OFFLINE.value,
                }).eq("device_id", device["device_id"]).execute()
                
                minutes_stale = device.get('minutes_stale', 0)
                print(f"🔴 Device {device['device_id']} ({device['name']}) marked OFFLINE - was stale for {minutes_stale:.1f} minutes")
                offline_count += 1
            
            # log the number of marked offline devices
            if offline_count > 0:
                print(f"📊 Scheduler: {offline_count} device(s) marked offline")
            else:
                if len(all_online.data) > 0:
                    print(f"✅ Scheduler: All {len(all_online.data)} online device(s) are responding (timeout: {self.timeout_minutes}min)")
                else:
                    # Only log this periodically to avoid spam when no devices
                    current_minute = datetime.now().minute
                    if current_minute % 5 == 0:  # Log every 5 minutes
                        print(f"📭 Scheduler: No online devices found (timeout: {self.timeout_minutes}min)")
                    
        except Exception as e:
            print(f"❌ Error checking offline devices: {e}")
            import traceback
            traceback.print_exc()


# Global scheduler instance
device_scheduler = DeviceScheduler(
    check_interval_minutes=settings.SCHEDULER_CHECK_INTERVAL_MINUTES,
    timeout_minutes=settings.SCHEDULER_TIMEOUT_MINUTES
)
