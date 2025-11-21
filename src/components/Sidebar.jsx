import React from 'react'
import Cookies from 'js-cookie'

export default function Sidebar({ sidebarOpen, setSidebarOpen, user, loading, chats }) {
  const currentUserId = user?._id

  const getOtherUser = (chat) => {
    return chat.participants.find(p => p._id !== currentUserId)
  }

  const getLastMessagePreview = (chat) => {
    if (!chat.lastMessage) return 'No messages yet'
    const senderPrefix = chat.lastMessage.sender._id === currentUserId ? 'You: ' : ''
    return senderPrefix + chat.lastMessage.content
  }

  return (
    <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 p-4 flex flex-col`}>
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="mb-4">
        {sidebarOpen ? '←' : '→'}
      </button>

      <ul className="flex flex-col gap-2">
        <li className="hover:text-gray-300 cursor-pointer">Dashboard</li>
      </ul>

      <div className="mt-4 flex-1 overflow-y-auto">
        <h2 className={`text-gray-400 text-sm mb-2 ${!sidebarOpen && 'hidden'}`}>My Chats</h2>
        {chats.length === 0 ? (
          <p className="text-gray-500 text-sm">{sidebarOpen ? 'No chats yet.' : ''}</p>
        ) : (
          chats.map(chat => {
            const otherUser = getOtherUser(chat)
            return (
              <a
                key={chat._id}
                href={`/chat/${chat._id}`}
                className="p-2 mb-2 bg-gray-800 rounded hover:bg-gray-700 cursor-pointer text-sm flex items-center gap-2"
              >
                {sidebarOpen && otherUser && (
                  <>
                    <img
                      src={otherUser.profile_image}
                      alt={otherUser.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 flex flex-col">
                      <span className="font-semibold">{otherUser.real_name}</span>
                      <span className="text-gray-400 text-sm truncate">{getLastMessagePreview(chat)}</span>
                    </div>
                  </>
                )}
                {!sidebarOpen && '💬'}
              </a>
            )
          })
        )}
      </div>

      <hr className="my-4 border-gray-700" />

      <div className="mt-auto flex flex-col items-start p-2">
        {loading && <p className="text-gray-400 text-sm">Loading user...</p>}
        {user && (
          <>
            <div className="flex items-center gap-2">
              <img
                src={user.profile_image}
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover"
              />
              <p className="text-white font-semibold">
                {user.real_name}{' '}
                <span className="text-gray-400">(@{user.username})</span>
                <span className="text-gray-500 mx-1">···</span>
              </p>
            </div>
            <p className="text-gray-400 text-sm mt-1 lowercase">{user.email}</p>
          </>
        )}
      </div>
    </div>
  )
}
