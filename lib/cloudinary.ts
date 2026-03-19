import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadAvatar(base64: string, userId: string) {
  const result = await cloudinary.uploader.upload(base64, {
    folder: 'sust-connect/avatars',
    public_id: `avatar_${userId}`,
    overwrite: true,
    transformation: [
      { width: 200, height: 200, crop: 'fill', gravity: 'face' },
      { quality: 'auto:low', fetch_format: 'webp' },
    ],
  })
  return { url: result.secure_url, public_id: result.public_id }
}

export async function uploadPostImage(base64: string, postId: string) {
  const result = await cloudinary.uploader.upload(base64, {
    folder: 'sust-connect/posts',
    public_id: `post_${postId}`,
    overwrite: true,
    transformation: [
      { width: 1080, crop: 'limit' },
      { quality: 'auto:good', fetch_format: 'webp' },
    ],
  })
  return { url: result.secure_url, public_id: result.public_id }
}

export default cloudinary
