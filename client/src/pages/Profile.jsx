import { useEffect, useState } from 'react'

function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token')

        if (!token) {
          setError('Please login first')
          setLoading(false)
          return
        }

        const response = await fetch('http://localhost:5000/api/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.message || 'Failed to fetch profile')
          setLoading(false)
          return
        }

        setProfile(data.user)
        setLoading(false)
      } catch (error) {
        setError('Unable to connect to server')
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    })
  }

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          age: profile.age || null,
          gender: profile.gender || null,
          address: profile.address || null,
          safety_preferences: profile.safety_preferences || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.message || 'Failed to update profile')
        return
      }

      setMessage('Profile updated successfully!')
      setEditing(false)
    } catch (error) {
      setMessage('Unable to connect to server')
    }
  }

  if (loading) {
    return <h2>Loading profile...</h2>
  }

  if (error) {
    return <h2>{error}</h2>
  }

  return (
    <div>
      <h1>My Profile</h1>

      <p><strong>Name:</strong> {profile.name}</p>
      <p><strong>Email:</strong> {profile.email}</p>
      <p><strong>Phone:</strong> {profile.phone || 'Not added'}</p>

      {editing ? (
        <>
          <p>
            <strong>Gender:</strong>{' '}
            <input
              name="gender"
              value={profile.gender || ''}
              onChange={handleChange}
              placeholder="Enter gender"
            />
          </p>

          <p>
            <strong>Age:</strong>{' '}
            <input
              name="age"
              type="number"
              value={profile.age || ''}
              onChange={handleChange}
              placeholder="Enter age"
            />
          </p>

          <p>
            <strong>Address:</strong>{' '}
            <input
              name="address"
              value={profile.address || ''}
              onChange={handleChange}
              placeholder="Enter address"
            />
          </p>

          <p>
            <strong>Safety Preferences:</strong>{' '}
            <input
              name="safety_preferences"
              value={profile.safety_preferences || ''}
              onChange={handleChange}
              placeholder="Enter safety preferences"
            />
          </p>

          <button onClick={handleUpdate}>Save Profile</button>
        </>
      ) : (
        <>
          <p><strong>Gender:</strong> {profile.gender || 'Not added'}</p>
          <p><strong>Age:</strong> {profile.age || 'Not added'}</p>
          <p><strong>Address:</strong> {profile.address || 'Not added'}</p>
          <p>
            <strong>Safety Preferences:</strong>{' '}
            {profile.safety_preferences || 'Not added'}
          </p>

          <button onClick={() => setEditing(true)}>Edit Profile</button>
        </>
      )}

      {message && <p>{message}</p>}
    </div>
  )
}

export default Profile