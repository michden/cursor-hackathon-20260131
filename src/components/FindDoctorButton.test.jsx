import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FindDoctorButton from './FindDoctorButton'

// Mock window.open
const mockOpen = vi.fn()

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('open', mockOpen)
  mockOpen.mockClear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('FindDoctorButton', () => {
  it('should render button with correct text', () => {
    render(<FindDoctorButton />)
    
    expect(screen.getByRole('button', { name: /find eye doctors near me/i })).toBeInTheDocument()
  })

  it('should show consent dialog on first click', async () => {
    const user = userEvent.setup()
    render(<FindDoctorButton />)
    
    await user.click(screen.getByRole('button', { name: /find eye doctors near me/i }))
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/find eye doctors near you/i)).toBeInTheDocument()
    expect(screen.getByText(/your privacy is protected/i)).toBeInTheDocument()
  })

  it('should show privacy notice in consent dialog', async () => {
    const user = userEvent.setup()
    render(<FindDoctorButton />)
    
    await user.click(screen.getByRole('button', { name: /find eye doctors near me/i }))
    
    expect(screen.getByText(/your location is used once/i)).toBeInTheDocument()
    expect(screen.getByText(/never stored or sent to our servers/i)).toBeInTheDocument()
  })

  it('should close consent dialog when cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<FindDoctorButton />)
    
    await user.click(screen.getByRole('button', { name: /find eye doctors near me/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should open Google search when "Search Without Location" is clicked', async () => {
    const user = userEvent.setup()
    render(<FindDoctorButton />)
    
    await user.click(screen.getByRole('button', { name: /find eye doctors near me/i }))
    await user.click(screen.getByRole('button', { name: /search without location/i }))
    
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('google.com/search'),
      '_blank'
    )
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('optometrist'),
      '_blank'
    )
  })

  it('should save consent as denied when "Search Without Location" is clicked', async () => {
    const user = userEvent.setup()
    render(<FindDoctorButton />)
    
    await user.click(screen.getByRole('button', { name: /find eye doctors near me/i }))
    await user.click(screen.getByRole('button', { name: /search without location/i }))
    
    expect(localStorage.getItem('visioncheck-location-consent')).toBe('denied')
  })

  it('should request geolocation when "Allow Location" is clicked', async () => {
    const user = userEvent.setup()
    const mockGetCurrentPosition = vi.fn((success) => {
      success({ coords: { latitude: 37.7749, longitude: -122.4194 } })
    })
    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition: mockGetCurrentPosition }
    })
    
    render(<FindDoctorButton />)
    
    await user.click(screen.getByRole('button', { name: /find eye doctors near me/i }))
    await user.click(screen.getByRole('button', { name: /allow location/i }))
    
    expect(mockGetCurrentPosition).toHaveBeenCalled()
  })

  it('should open Google Maps with coordinates on successful geolocation', async () => {
    const user = userEvent.setup()
    const mockGetCurrentPosition = vi.fn((success) => {
      success({ coords: { latitude: 37.7749, longitude: -122.4194 } })
    })
    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition: mockGetCurrentPosition }
    })
    
    render(<FindDoctorButton />)
    
    await user.click(screen.getByRole('button', { name: /find eye doctors near me/i }))
    await user.click(screen.getByRole('button', { name: /allow location/i }))
    
    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('google.com/maps/search'),
        '_blank'
      )
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('37.7749'),
        '_blank'
      )
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('-122.4194'),
        '_blank'
      )
    })
  })

  it('should save consent as granted after successful geolocation', async () => {
    const user = userEvent.setup()
    const mockGetCurrentPosition = vi.fn((success) => {
      success({ coords: { latitude: 37.7749, longitude: -122.4194 } })
    })
    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition: mockGetCurrentPosition }
    })
    
    render(<FindDoctorButton />)
    
    await user.click(screen.getByRole('button', { name: /find eye doctors near me/i }))
    await user.click(screen.getByRole('button', { name: /allow location/i }))
    
    await waitFor(() => {
      expect(localStorage.getItem('visioncheck-location-consent')).toBe('granted')
    })
  })

  it('should skip consent dialog if consent was previously granted', async () => {
    localStorage.setItem('visioncheck-location-consent', 'granted')
    const user = userEvent.setup()
    const mockGetCurrentPosition = vi.fn((success) => {
      success({ coords: { latitude: 37.7749, longitude: -122.4194 } })
    })
    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition: mockGetCurrentPosition }
    })
    
    render(<FindDoctorButton />)
    
    await user.click(screen.getByRole('button', { name: /find eye doctors near me/i }))
    
    // Should not show dialog, should directly request location
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockGetCurrentPosition).toHaveBeenCalled()
  })

  it('should fallback to Google search when geolocation permission is denied', async () => {
    const user = userEvent.setup()
    const mockGetCurrentPosition = vi.fn((_, error) => {
      error({ code: 1, message: 'User denied geolocation' })
    })
    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition: mockGetCurrentPosition }
    })
    
    render(<FindDoctorButton />)
    
    await user.click(screen.getByRole('button', { name: /find eye doctors near me/i }))
    await user.click(screen.getByRole('button', { name: /allow location/i }))
    
    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('google.com/search'),
        '_blank'
      )
    })
  })

  it('should show error message when geolocation fails with other error', async () => {
    const user = userEvent.setup()
    const mockGetCurrentPosition = vi.fn((_, error) => {
      error({ code: 2, message: 'Position unavailable' })
    })
    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition: mockGetCurrentPosition }
    })
    
    render(<FindDoctorButton />)
    
    await user.click(screen.getByRole('button', { name: /find eye doctors near me/i }))
    await user.click(screen.getByRole('button', { name: /allow location/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/could not get your location/i)).toBeInTheDocument()
    })
  })

  it('should show loading state while getting location', async () => {
    const user = userEvent.setup()
    // Don't resolve the position immediately
    const mockGetCurrentPosition = vi.fn()
    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition: mockGetCurrentPosition }
    })
    
    render(<FindDoctorButton />)
    
    await user.click(screen.getByRole('button', { name: /find eye doctors near me/i }))
    await user.click(screen.getByRole('button', { name: /allow location/i }))
    
    expect(screen.getByText(/finding nearby doctors/i)).toBeInTheDocument()
  })

  it('should handle missing geolocation API', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('navigator', {})
    
    render(<FindDoctorButton />)
    
    await user.click(screen.getByRole('button', { name: /find eye doctors near me/i }))
    await user.click(screen.getByRole('button', { name: /allow location/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/could not get your location/i)).toBeInTheDocument()
    })
  })
})
