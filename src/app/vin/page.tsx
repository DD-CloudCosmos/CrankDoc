import { VinDecoder } from '@/components/VinDecoder'

export default function VinPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold">VIN Decoder</h1>
        <p className="text-muted-foreground">
          Decode your motorcycle&apos;s Vehicle Identification Number using NHTSA data
        </p>
      </div>

      <VinDecoder />
    </div>
  )
}
