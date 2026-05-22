import { useState, useRef, useEffect } from 'react'
import { compressImageToBase64, getBase64SizeKb, isValidImageType } from '../utils/imageUtils'

export default function PhotoCapture({ onPhotoChange }) {
  const [photo, setPhoto]                = useState(null)
  const [photo_size_kb, setPhotoSizeKb]  = useState(null)
  const [photo_error, setPhotoError]     = useState(null)
  const [photo_loading, setPhotoLoading] = useState(false)
  const [url_input, setUrlInput]         = useState('')
  const [active_tab, setActiveTab]       = useState('camera')
  const [camera_active, setCameraActive] = useState(false)
  const [stream, setStream]              = useState(null)

  const gallery_input_ref = useRef(null)
  const video_ref         = useRef(null)
  const canvas_ref        = useRef(null)

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop())
    }
  }, [stream])

  const processFile = async (file) => {
    if (!file) return
    if (!isValidImageType(file)) {
      setPhotoError('Invalid file type. Use JPG, PNG or WEBP.')
      return
    }
    setPhotoLoading(true)
    setPhotoError(null)
    try {
      const base64  = await compressImageToBase64(file)
      const size_kb = getBase64SizeKb(base64)
      setPhoto(base64)
      setPhotoSizeKb(size_kb)
      onPhotoChange(base64)
    } catch (err) {
      setPhotoError(err.message || 'Error processing image')
      onPhotoChange(null)
    } finally {
      setPhotoLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const startCamera = async () => {
    setPhotoError(null)
    try {
      const media_stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      })
      setStream(media_stream)
      setCameraActive(true)
      // Wait for video element to mount
      setTimeout(() => {
        if (video_ref.current) {
          video_ref.current.srcObject = media_stream
          video_ref.current.play()
        }
      }, 100)
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setPhotoError('Camera access denied. Please allow camera permission in your browser settings.')
      } else if (err.name === 'NotFoundError') {
        setPhotoError('No camera found on this device.')
      } else {
        setPhotoError(`Camera error: ${err.message}`)
      }
    }
  }

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(t => t.stop())
    setStream(null)
    setCameraActive(false)
  }

  const takePhoto = () => {
    if (!video_ref.current || !canvas_ref.current) return
    const video  = video_ref.current
    const canvas = canvas_ref.current
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const base64  = canvas.toDataURL('image/jpeg', 0.9)
    const size_kb = getBase64SizeKb(base64)
    stopCamera()
    setPhoto(base64)
    setPhotoSizeKb(size_kb)
    onPhotoChange(base64)
  }

  const handleUrlSubmit = async () => {
    if (!url_input.trim()) {
      setPhotoError('Please enter a valid URL.')
      return
    }
    setPhotoLoading(true)
    setPhotoError(null)
    try {
      const response = await fetch(url_input)
      if (!response.ok) throw new Error('Could not load image from URL')
      const blob = await response.blob()
      if (!blob.type.startsWith('image/')) throw new Error('URL does not point to an image')
      const file = new File([blob], 'url_image.jpg', { type: blob.type })
      await processFile(file)
      setUrlInput('')
    } catch (err) {
      // CORS fallback — use URL directly
      setPhoto(url_input)
      setPhotoSizeKb('URL')
      onPhotoChange(url_input)
      setUrlInput('')
    } finally {
      setPhotoLoading(false)
    }
  }

  const clearPhoto = () => {
    setPhoto(null)
    setPhotoSizeKb(null)
    setPhotoError(null)
    setUrlInput('')
    stopCamera()
    onPhotoChange(null)
    if (gallery_input_ref.current) gallery_input_ref.current.value = ''
  }

  const tabs = [
    { id: 'camera',  label: '📷 Camera'  },
    { id: 'gallery', label: '🖼️ Gallery' },
    { id: 'url',     label: '🔗 URL'     },
  ]

  return (
    <div className="flex flex-col gap-3">

      {/* Hidden gallery input */}
      <input
        ref={gallery_input_ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Canvas for capture (hidden) */}
      <canvas ref={canvas_ref} className="hidden" />

      {!photo ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6
                        flex flex-col gap-4">

          {/* Tabs */}
          {!camera_active && (
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setActiveTab(tab.id); setPhotoError(null) }}
                  className={`flex-1 text-xs font-medium py-1.5 px-2 rounded-md
                              transition-colors
                              ${active_tab === tab.id
                                ? 'bg-white text-violet-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                              }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Camera tab */}
          {active_tab === 'camera' && (
            <div className="flex flex-col items-center gap-3">
              {!camera_active ? (
                <>
                  <span className="text-4xl">📷</span>
                  <p className="text-gray-400 text-sm text-center">
                    Opens your device camera — browser will ask for permission
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="bg-violet-600 hover:bg-violet-700 text-white
                               text-sm font-medium px-6 py-2.5 rounded-lg
                               transition-colors"
                  >
                    📷 Activate camera
                  </button>
                  <p className="text-xs text-gray-400 text-center">
                    You will see a permission prompt on first use
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="relative w-full rounded-xl overflow-hidden bg-black">
                    <video
                      ref={video_ref}
                      autoPlay
                      playsInline
                      muted
                      className="w-full rounded-xl"
                      style={{ maxHeight: '300px', objectFit: 'cover' }}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={takePhoto}
                      className="bg-violet-600 hover:bg-violet-700 text-white
                                 text-sm font-medium px-6 py-2.5 rounded-lg
                                 transition-colors"
                    >
                      📸 Take photo
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700
                                 text-sm font-medium px-4 py-2.5 rounded-lg
                                 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gallery tab */}
          {active_tab === 'gallery' && (
            <div className="flex flex-col items-center gap-3">
              <span className="text-4xl">🖼️</span>
              <p className="text-gray-400 text-sm text-center">
                Choose an existing photo from your device
              </p>
              <button
                type="button"
                onClick={() => gallery_input_ref.current?.click()}
                disabled={photo_loading}
                className="bg-gray-700 hover:bg-gray-800 disabled:bg-gray-300
                           text-white text-sm font-medium px-6 py-2.5 rounded-lg
                           transition-colors"
              >
                {photo_loading ? '⏳ Processing...' : '🖼️ Choose from gallery'}
              </button>
            </div>
          )}

          {/* URL tab */}
          {active_tab === 'url' && (
            <div className="flex flex-col gap-3">
              <p className="text-gray-400 text-sm text-center">
                Paste a direct image URL
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url_input}
                  onChange={(e) => { setUrlInput(e.target.value); setPhotoError(null) }}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2
                             text-sm focus:outline-none focus:ring-2
                             focus:ring-violet-400 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  disabled={photo_loading || !url_input.trim()}
                  className="bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300
                             text-white text-sm font-medium px-4 py-2 rounded-lg
                             transition-colors whitespace-nowrap"
                >
                  {photo_loading ? '⏳' : 'Load'}
                </button>
              </div>
            </div>
          )}

          {photo_loading && (
            <p className="text-violet-500 text-sm text-center animate-pulse">
              ⏳ Compressing and validating...
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <img
              src={photo}
              alt="Photo preview"
              className="w-full max-h-64 object-cover rounded-xl border border-gray-200"
              onError={() => { setPhotoError('Could not load image.'); clearPhoto() }}
            />
            <button
              type="button"
              onClick={clearPhoto}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600
                         text-white rounded-full w-7 h-7 flex items-center
                         justify-center text-sm font-bold transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span> Photo ready</span>
            {photo_size_kb === 'URL' ? (
              <span className="font-mono font-medium text-blue-500">🔗 External URL</span>
            ) : (
              <span className={`font-mono font-medium ${
                parseFloat(photo_size_kb) > 45 ? 'text-amber-500' : 'text-green-500'
              }`}>
                {photo_size_kb} kb / 50 kb max
              </span>
            )}
          </div>
        </div>
      )}

      {photo_error && (
        <p className="text-red-500 text-sm">{photo_error}</p>
      )}
    </div>
  )
}