import React, { useEffect, useState, useRef } from "react";
import axios from "axios"

// ChatGPT-like single-file React component using Tailwind CSS (Dark Mode)
// Usage: drop this component into a Create React App / Vite React project
// Tailwind must be configured in the project separately. This version uses dark-first styles.

export default function Home() {
  // Data structures
  const [chats, setChats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("vzual_chats")) || [];
    } catch {
      return [];
    }
  });
  const [activeChatId, setActiveChatId] = useState(() => {
    return chats.length ? chats[0].id : null;
  });
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  // keep activeChat synced when chats change
  useEffect(() => {
    if (!activeChatId && chats.length) setActiveChatId(chats[0].id);
    localStorage.setItem("vzual_chats", JSON.stringify(chats));
  }, [chats, activeChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [activeChatId]);

  function scrollToBottom() {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }

  async function createNewChat() {

    let title = window.prompt("Enter the title of new chat ")
    const response =await axios.post("http://localhost:3000/api/chat",{
      title:title
    },{
      withCredentials:true,
    })
    
    const id = Date.now().toString();
    const newChat = {
      id,
      title: response.data.chat.title ,
      messages: [
        { id:response.data.chat._id , role: "system",},
      ],
    };
    
    

    console.log(response.data);
    
    setChats((s) => [newChat, ...s]);
    setActiveChatId(id);
    setInput("");
  }

  function deleteChat(id) {
    setChats((s) => s.filter((c) => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  }

  function renameChat(id, title) {
    setChats((s) => s.map((c) => (c.id === id ? { ...c, title } : c)));
  }

  function addMessageToChat(chatId, message) {
    setChats((s) =>
      s.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, message] } : c))
    );
  }

  // Called when user submits message
  async function handleSend(e) {
    e && e.preventDefault();
    const text = input.trim();
    if (!text || !activeChatId) return;

    const userMessage = { id: `u-${Date.now()}`, role: "user", text };
    addMessageToChat(activeChatId, userMessage);
    setInput("");
    setIsSending(true);

    // Optimistic assistant placeholder
    const placeholder = { id: `a-${Date.now()}`, role: "assistant", text: "..." };
    addMessageToChat(activeChatId, placeholder);

    try {
      // Example fetch to backend. Replace URL and payload according to your API.
      // Backend should accept { chatId, messages } and return assistant reply { text }
      const activeChat = chats.find((c) => c.id === activeChatId) || { messages: [] };
      const payload = {
        chatId: activeChatId,
        // send the last N messages to the backend to maintain context
        messages: [...activeChat.messages, userMessage].slice(-20),
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Network response was not ok");

      const data = await res.json();
      const assistantText = data?.text ?? "(no response)";

      // replace last assistant placeholder with real message
      setChats((s) =>
        s.map((c) => {
          if (c.id !== activeChatId) return c;
          // drop the placeholder (last assistant with text '...') and add real
          const withoutPlaceholder = c.messages.filter((m) => m.text !== "...");
          return { ...c, messages: [...withoutPlaceholder, { id: `a-${Date.now()}`, role: "assistant", text: assistantText }] };
        })
      );
    } catch (err) {
      // mark assistant message as error
      setChats((s) =>
        s.map((c) => {
          if (c.id !== activeChatId) return c;
          return {
            ...c,
            messages: [...c.messages, { id: `err-${Date.now()}`, role: "assistant", text: "Error: could not reach server" }],
          };
        })
      );
      console.error(err);
    } finally {
      setIsSending(false);
      scrollToBottom();
    }
  }

  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      {/* Left sidebar */}
      <aside className="w-80 bg-gray-800 border-r border-gray-700 flex-shrink-0 hidden md:flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <button
            onClick={createNewChat}
            className="w-full rounded-md px-3 py-2 bg-indigo-600 text-white font-medium hover:opacity-90"
          >
            + New chat
          </button>
        </div>

        <div className="p-3 overflow-auto flex-1">
          {chats.length === 0 ? (
            <div className="text-sm text-gray-400">No chats yet. Start a new one.</div>
          ) : (
            <ul className="space-y-2">
              {chats.map((c) => (
                <li
                  key={c.id}
                  className={`p-2 rounded-md cursor-pointer hover:bg-gray-700 flex items-center justify-between ${c.id === activeChatId ? "bg-gray-700" : ""}`}
                  onClick={() => setActiveChatId(c.id)}
                >
                  <div className="flex-1 pr-2">
                    <div className="text-sm font-medium truncate">{c.title || "Untitled"}</div>
                    <div className="text-xs text-gray-400 truncate">{c.messages?.slice(-1)[0]?.text ?? ""}</div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newTitle = prompt("Rename chat", c.title || "Untitled");
                        if (newTitle !== null) renameChat(c.id, newTitle);
                      }}
                      className="text-xs text-gray-400 hover:text-gray-200"
                    >
                      rename
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this chat?")) deleteChat(c.id);
                      }}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-3 border-t border-gray-700 text-xs text-gray-400">VzualVibe • React + Tailwind (Dark)</div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col">
        {/* top bar for small screens */}
        <div className="md:hidden p-3 border-b bg-gray-800 border-gray-700 flex items-center justify-between">
          <button
            onClick={createNewChat}
            className="rounded-md px-3 py-2 bg-indigo-600 text-white font-medium"
          >
            + New
          </button>
          <div className="text-sm font-semibold">Chat</div>
          <div className="text-xs text-gray-400">Menu</div>
        </div>

        {/* chat content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto p-6 bg-gradient-to-b from-gray-900 to-gray-800">
            {!activeChat ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                <h2 className="text-2xl font-semibold mb-2">Start a new conversation</h2>
                <p className="text-sm mb-4">Click "New chat" on the left to begin.</p>
                <button onClick={createNewChat} className="px-4 py-2 rounded-md bg-indigo-600 text-white">New chat</button>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto">
                <header className="mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{activeChat.title || "Chat"}</h3>
                    <div className="text-sm text-gray-400">{activeChat.messages.length} messages</div>
                  </div>
                </header>

                <div className="space-y-4">
                  {activeChat.messages.map((m) => (
                    <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                      <div
                        className={`inline-block p-3 rounded-lg max-w-[90%] whitespace-pre-wrap break-words ${
                          m.role === "user"
                            ? "bg-indigo-600 text-white rounded-tr-none"
                            : "bg-gray-800 border border-gray-700 text-gray-200"
                        }`}
                      >
                        <div className="text-sm">{m.text}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* input area */}
          <form onSubmit={handleSend} className="p-4 border-t bg-gray-900 border-gray-700">
            <div className="max-w-3xl mx-auto flex gap-3 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                placeholder="Type your message..."
                className="flex-1 resize-none rounded-md border border-gray-700 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSending}
                  className="rounded-md px-4 py-2 bg-indigo-600 text-white disabled:opacity-60"
                >
                  {isSending ? "Sending..." : "Send"}
                </button>
                <button
                  type="button"
                  onClick={() => setInput("")}
                  className="text-sm text-gray-400"
                >
                  Clear
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
