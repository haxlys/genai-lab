import { describe, it, expect } from 'vitest'
import { resolveImageSrc } from '../image-src'

const RAW = 'https://raw.githubusercontent.com/microsoft/generative-ai-for-beginners/main/'

describe('resolveImageSrc', () => {
  it('returns undefined for undefined input', () => {
    expect(resolveImageSrc(undefined)).toBeUndefined()
  })

  it('passes absolute URLs through unchanged', () => {
    expect(resolveImageSrc('https://example.com/x.png')).toBe('https://example.com/x.png')
    expect(resolveImageSrc('data:image/png;base64,iVBORw')).toBe('data:image/png;base64,iVBORw')
    expect(resolveImageSrc('blob:abc')).toBe('blob:abc')
  })

  it('rewrites relative paths to GitHub raw URL', () => {
    const out = resolveImageSrc('../../../translated_images/ko/x.webp')
    expect(out).toBe(`${RAW}translated_images/ko/x.webp`)
  })

  it('strips ./ prefix', () => {
    const out = resolveImageSrc('./images/foo.png')
    expect(out).toBe(`${RAW}images/foo.png`)
  })

  it('uses imageMap fallback when key matches', () => {
    const map = {
      '../../../translated_images/ko/foo.webp': '01-introduction-to-genai/images/foo.png',
    }
    const out = resolveImageSrc('../../../translated_images/ko/foo.webp', map)
    expect(out).toBe(`${RAW}01-introduction-to-genai/images/foo.png`)
  })

  it('preserves absolute URLs in imageMap value', () => {
    const map = {
      '../../../translated_images/ko/foo.webp': 'https://example.com/foo.png',
    }
    const out = resolveImageSrc('../../../translated_images/ko/foo.webp', map)
    expect(out).toBe('https://example.com/foo.png')
  })

  it('falls through to default rewriting if imageMap key does not match', () => {
    const map = { 'other.webp': 'fallback.png' }
    const out = resolveImageSrc('../../../translated_images/ko/foo.webp', map)
    expect(out).toBe(`${RAW}translated_images/ko/foo.webp`)
  })
})
