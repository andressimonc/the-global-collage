// Lift the subject out of a picture (the same lift Photos uses), as a transparent PNG.
//   tools/bin/cutout <in> <out.png> [all | <n>]     n = one instance (1-based); default all subjects together
// Prints how many separate subjects it found. Build: swiftc -O tools/cutout.swift -o tools/bin/cutout
import Vision
import CoreImage

let args = CommandLine.arguments
guard args.count >= 3 else { print("usage: cutout <in> <out.png> [all|<n>]"); exit(2) }
guard let image = CIImage(contentsOf: URL(fileURLWithPath: args[1]), options: [.applyOrientationProperty: true]) else { print("cannot read", args[1]); exit(1) }
let handler = VNImageRequestHandler(ciImage: image)
let request = VNGenerateForegroundInstanceMaskRequest()
do {
    try handler.perform([request])
    guard let found = request.results?.first else { print("subjects: 0"); exit(3) }
    var which = found.allInstances
    if args.count > 3, let n = Int(args[3]) {
        guard which.contains(n) else { print("subjects:", which.count, "- no instance", n); exit(3) }
        which = IndexSet(integer: n)
    }
    let buffer = try found.generateMaskedImage(ofInstances: which, from: handler, croppedToInstancesExtent: true)
    try CIContext().writePNGRepresentation(of: CIImage(cvPixelBuffer: buffer), to: URL(fileURLWithPath: args[2]), format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
    print("subjects:", found.allInstances.count)
} catch { print("failed:", error.localizedDescription); exit(1) }
