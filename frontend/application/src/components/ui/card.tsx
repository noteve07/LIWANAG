import * as React from "react"

// Use type instead of interface for these simple extensions
type CardProps = React.HTMLAttributes<HTMLDivElement>

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`bg-gray-800 rounded-lg border border-gray-700 shadow-md ${className || ""}`}
      {...props}
    />
  )
)
Card.displayName = "Card"

type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`p-6 ${className || ""}`}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={`text-lg font-bold text-white ${className || ""}`}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={`text-sm text-gray-400 ${className || ""}`}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"

type CardContentProps = React.HTMLAttributes<HTMLDivElement>

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`p-6 pt-0 ${className || ""}`}
      {...props}
    />
  )
)
CardContent.displayName = "CardContent"

type CardFooterProps = React.HTMLAttributes<HTMLDivElement>

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`p-6 pt-0 ${className || ""}`}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }