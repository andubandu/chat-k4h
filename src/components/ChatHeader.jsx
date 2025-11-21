import React, { useEffect, useState } from 'react'

export default function ChatHeader({ messages, user }) {
  const [otherUser, setOtherUser] = useState(null)

  useEffect(() => {
    if (!messages.length || !user) return
    const partner = messages.find(m => m.sender._id !== user._id)?.sender
    setOtherUser(partner)
  }, [messages, user])

  if (!otherUser) return null

  return (
    <div className="flex items-center p-4 border-b bg-white">
      <img
        src={otherUser.profile_image}
        alt={otherUser.username}
        className="w-10 h-10 rounded-full object-cover mr-3"
      />
      <div>
        <p className="font-semibold">{otherUser.real_name}</p>
        <p className="text-sm text-gray-500">@{otherUser.username}</p>
      </div>
    </div>
  )
}
