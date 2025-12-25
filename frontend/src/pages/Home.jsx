import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";

export default function Home() {
  const [chats, setChats] = useState([]); // chats from DB: each chat should have _id, title, Messages[]
  const [activeChatId, setActiveChatId] = useState(null); // will set after chats load
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [Socket, setSocket] = useState(null)
  const MessagesEndRef = useRef(null);
  const [Messages, setMessages] = useState([{
    type: "ai",
    content: "Hello, How can I help you today"
  }])

  // fetch chats from server on mount
  useEffect(() => {
    axios
      .get("https://mygpt-38lz.onrender.com//api/chat", { withCredentials: true })
      .then((res) => {
        setChats(res.data.chats || []);
        console.log(res);
      })


    const tempSocket = io("https://mygpt-38lz.onrender.com/", {
      withCredentials: true
    })

    tempSocket.on("connect", () => {
      console.log("✅ Socket connected:",);
    });


    tempSocket.on('ai-response', (messagePayload) => {
      console.log("received ai message", messagePayload);
      setMessages((prevMessages) => [...prevMessages, {
        type: "ai",
        content: messagePayload.content
      }])

      setIsSending(false)


    })

    setSocket(tempSocket)
  }, []);

  //all mesages chat k 

  const getMesages = async (chatId) => {
    const response = await axios.get(
      `https://mygpt-38lz.onrender.com//api/chat/${chatId}`,
      { withCredentials: true }
    )
    console.log("fetched messages", response.data.messages);

    setMessages(response.data.messages)

  }
  //ye tb run hota h jb hm koi chat ko select kiye rehte h
  useEffect(() => {
    if (activeChatId) {
      getMesages(activeChatId);
    }
  }, [activeChatId])

  // keep activeChat synced when chats change (pick first if none)
  useEffect(() => {
    if (!activeChatId && chats.length) {
      setActiveChatId(chats[0]._id);
    }
  }, [chats, activeChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [Messages]);

  function scrollToBottom() {
    if (MessagesEndRef.current) {
      MessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }

  async function createNewChat() {
    const title = window.prompt("Enter the title of new chat") || "Untitled";
    try {
      const response = await axios.post(
        "https://mygpt-38lz.onrender.com//api/chat",
        { title },
        { withCredentials: true }
      );

      // getMesages(response.data.chat.id)

      console.log(response);


      // server should return chat with _id
      const serverChat = response.data?.chat;
      const newId = serverChat ?? Date.now().toString();

      const newChat = {
        _id: newId,
        title: response.data.chat.title,
        Messages: []
      };

      setChats((s) => [newChat, ...s]);
      setActiveChatId(newId);
      setInput("");
    } catch (err) {
      console.error("Create chat failed:", err);
      // optional: show user friendly error
    }
  }

  function deleteChat(id) {
    setChats((s) => s.filter((c) => c._id !== id));
    if (activeChatId === id) setActiveChatId(null);
    // optional: call server to delete
  }

  function renameChat(id, title) {
    setChats((s) => s.map((c) => (c._id === id ? { ...c, title } : c)));
    // optional: patch server
  }

  // function addMessageToChat(chatId, message) {
  //   setChats((s) =>
  //     s.map((c) => (c._id === chatId ? { ...c, Messages: [...c.Messages, message] } : c))
  //   );
  // }

  // send message
  function handleSend(e) {
  e.preventDefault();

  if (!activeChatId) return;
  if (!input.trim()) return;

  const text = input;

  // ✅ SABSE PEHLE INPUT CLEAR
  setInput("");

  // user message
  setMessages((prev) => [
    ...prev,
    { role: "user", content: text }
  ]);

  // loading start
  setIsSending(true);

  // socket emit
  Socket.emit("ai-message", {
    chat: activeChatId,
    content: text
  });
}

  const activeChat = chats.find((c) => c._id === activeChatId);

  return (
    <div className="h-screen bg-gray-900 text-gray-100 flex">
      {/* Left sidebar */}
      <aside className="w-80 bg-gray-800 border-r border-gray-700 flex-shrink-0 hidden md:flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <button onClick={createNewChat} className="w-full rounded-md px-3 py-2 bg-indigo-600 text-white font-medium hover:opacity-90">
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
                  key={c._id} // <= stable unique key
                  className={`p-2 rounded-md cursor-pointer hover:bg-gray-700 flex items-center justify-between ${c._id === activeChatId ? "bg-gray-700" : ""}`}
                  onClick={() => setActiveChatId(c._id)}
                >
                  <div className="flex-1 pr-2">
                    <div className="text-sm font-medium truncate">{c.title || "Untitled"}</div>
                    <div className="text-xs text-gray-400 truncate">{c.Messages?.slice(-1)[0]?.text ?? ""}</div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newTitle = prompt("Rename chat", c.title || "Untitled");
                        if (newTitle !== null) renameChat(c._id, newTitle);
                      }}
                      className="text-xs text-gray-400 hover:text-gray-200"
                    >
                      rename
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this chat?")) deleteChat(c._id);
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
          <button onClick={createNewChat} className="rounded-md px-3 py-2 bg-indigo-600 text-white font-medium">
            + New
          </button>
          <div className="text-sm font-semibold">Chat</div>
          <div className="text-xs text-gray-400">Menu</div>
        </div>

        {/* chat content */}
        <div className="flex-1 overflow-hidden scrollbar-none flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 scrollbar-none bg-gradient-to-b from-gray-900 to-gray-800">

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
                    <div className="text-sm text-gray-400">{Messages?.length ?? 0} Messages</div>
                  </div>
                </header>

                <div className="space-y-4">
                  {Messages?.map((m) => (
                    <div key={m.id ?? m._id ?? `${m.role}-${Math.random()}`} className={m.role === "user" ? "text-right" : "text-left"}>
                      <div
                        className={`inline-block p-3 rounded-lg max-w-[90%] whitespace-pre-wrap break-words ${m.role === "user"
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-gray-800 border border-gray-700 text-gray-200"
                          }`}
                      >
                        <div className="text-sm">{m.content}</div>
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="text-left">
                      <div className="inline-block p-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-200">
                        <span className="animate-pulse">...</span>
                      </div>
                    </div>
                  )}

                  <div ref={MessagesEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* input area */}
          <form onSubmit={handleSend} className="p-4 border-t bg-gray-900 border-gray-700">
            <div className="max-w-3xl max-h-40 overflow-y-auto scrollbar-none mx-auto flex gap-3 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                placeholder="Type your message..."
                className="flex-1 max-h-40 overflow-y-auto scrollbar-none resize-none rounded-md border border-gray-700 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />

              <div className="flex items-center gap-2">
                <button type="submit" disabled={isSending} className="rounded-md px-4 py-2 bg-indigo-600 text-white disabled:opacity-60">
                  {isSending ? "Sending..." : "Send"}
                </button>
                <button type="button" onClick={() => setInput("")} className="text-sm text-gray-400">
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
