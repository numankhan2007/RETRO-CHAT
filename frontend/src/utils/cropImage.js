export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous') 
    image.src = url
  })

export default async function getCroppedImg(
  imageSrc,
  pixelCrop,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  // We want a standard size for profile pictures to save bandwidth
  const MAX_SIZE = 500
  const scale = Math.min(MAX_SIZE / pixelCrop.width, MAX_SIZE / pixelCrop.height)
  
  canvas.width = pixelCrop.width * scale
  canvas.height = pixelCrop.height * scale

  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
  ctx.rotate((rotation * Math.PI) / 180)

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    -canvas.width / 2,
    -canvas.height / 2,
    canvas.width,
    canvas.height
  )

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob)
      },
      'image/webp',
      0.9
    )
  })
}
