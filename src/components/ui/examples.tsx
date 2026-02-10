/**
 * Example usage of shadcn/ui Button and Card components
 *
 * This file demonstrates how to use the Button and Card components
 * with various variants, sizes, and compositions.
 *
 * DELETE THIS FILE AFTER REVIEWING - it's just for reference.
 */

import { Button } from './button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card'

export function ButtonExamples() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-2xl font-bold">Button Variants</h2>

      {/* Variants */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>

      {/* Sizes */}
      <h2 className="text-2xl font-bold">Button Sizes</h2>
      <div className="flex gap-2 items-center flex-wrap">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon">X</Button>
      </div>

      {/* States */}
      <h2 className="text-2xl font-bold">Button States</h2>
      <div className="flex gap-2 flex-wrap">
        <Button>Enabled</Button>
        <Button disabled>Disabled</Button>
      </div>

      {/* With onClick */}
      <h2 className="text-2xl font-bold">Interactive Button</h2>
      <Button onClick={() => alert('Button clicked!')}>
        Click me
      </Button>

      {/* asChild example */}
      <h2 className="text-2xl font-bold">Button as Link</h2>
      <Button asChild>
        <a href="/">Home</a>
      </Button>
    </div>
  )
}

export function CardExamples() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-2xl font-bold">Card Components</h2>

      {/* Basic Card */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Card</CardTitle>
          <CardDescription>This is a simple card with just a header.</CardDescription>
        </CardHeader>
      </Card>

      {/* Full Card */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Card Example</CardTitle>
          <CardDescription>
            A card with all sections: header, content, and footer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            This is the main content area of the card. You can put any content here,
            including text, images, or other components.
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline">Cancel</Button>
          <Button>Save</Button>
        </CardFooter>
      </Card>

      {/* Card with buttons in header */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Card with Actions</CardTitle>
            <CardDescription>Header with inline buttons</CardDescription>
          </div>
          <Button size="sm" variant="ghost">
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400">
            You can customize the layout by overriding default classes.
          </p>
        </CardContent>
      </Card>

      {/* Nested Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Diagnostic Step</CardTitle>
          <CardDescription>Check fuel pressure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Required Tools:</p>
            <ul className="text-sm text-zinc-400 list-disc list-inside">
              <li>Fuel pressure gauge</li>
              <li>Service manual</li>
            </ul>
          </div>

          <Card className="bg-zinc-800">
            <CardHeader>
              <CardTitle className="text-base">Safety Warning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-400">
                Work in a well-ventilated area. Have fire extinguisher nearby.
              </p>
            </CardContent>
          </Card>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline">Back</Button>
          <Button>Complete Step</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
