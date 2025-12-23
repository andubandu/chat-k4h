import React from "react";
import Cookies from "js-cookie";

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  user,
  loading,
  chats,
}) {
  const currentUserId = user?._id;

  const getOtherUser = (chat) => {
    return chat.participants.find((p) => p._id !== currentUserId);
  };

  const getLastMessagePreview = (chat) => {
    if (!chat.lastMessage) return "No messages yet";
    const senderPrefix =
      chat.lastMessage.sender._id === currentUserId ? "You: " : "";
    return senderPrefix + chat.lastMessage.content;
  };

  const emergencyLogout = () => {
    Cookies.remove("token");
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("/login");
  };

  return (
    <div
      className={`
        ${sidebarOpen ? "w-72" : "w-20"}
        bg-gray-900 text-white h-screen
        border-r border-gray-800
        transition-all duration-300
        flex flex-col shadow-xl
      `}
    >
      <div className="flex flex-col gap-2 p-3 border-b border-gray-800">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-800 transition text-xl"
        >
          {sidebarOpen ? "🔙 Collapse" : "➡️"}
        </button>

        {sidebarOpen && (
          <button
            onClick={emergencyLogout}
            className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition text-sm"
          >
            🚨 Emergency Logout
          </button>
        )}
      </div>

      <div className="px-4 mt-4">
        <ul className="flex flex-col gap-3">
          <li className="hover:bg-gray-800 p-2 rounded-lg cursor-pointer transition flex items-center gap-2">
            {!sidebarOpen && <span className="text-xl">🏠</span>}
            {sidebarOpen && <span className="font-medium">Dashboard</span>}
          </li>
        </ul>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto px-4 custom-scroll">
        {sidebarOpen && (
          <h2 className="text-gray-400 text-xs uppercase tracking-wide mb-2">
            My Chats
          </h2>
        )}

        {chats.length === 0 ? (
          <p className="text-gray-500 text-sm">
            {sidebarOpen && "No chats yet."}
          </p>
        ) : (
          chats.map((chat) => {
            const otherUser = getOtherUser(chat);

            return (
              <a
                key={chat._id}
                href={`/chat/${chat._id}`}
                className="flex items-center gap-3 p-3 bg-gray-800/60 rounded-lg hover:bg-gray-700 transition cursor-pointer mb-2"
              >
                {!sidebarOpen && <span className="text-xl">💬</span>}

                {sidebarOpen && otherUser && (
                  <>
                    <img
                      src={otherUser.profile_image}
                      alt={otherUser.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />

                    <div className="flex flex-col overflow-hidden">
                      <span className="font-semibold">
                        {otherUser.real_name}
                      </span>
                      <span className="text-gray-400 text-sm truncate">
                        {getLastMessagePreview(chat)}
                      </span>
                    </div>
                  </>
                )}
              </a>
            );
          })
        )}
      </div>

      <div className="p-4 border-t border-gray-800">
        {loading && (
          <p className="text-gray-400 text-sm">Loading user...</p>
        )}

        {user && (
          <div className="flex items-center gap-3">
            <img
              src={user.profile_image}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />

            {sidebarOpen && (
              <div>
                <p className="font-semibold">
                  {user.real_name}{" "}
                  <span className="text-gray-400">@{user.username}</span>
                </p>
                <p className="text-gray-500 text-xs">{user.email}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
