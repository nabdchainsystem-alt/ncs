import React, { useState } from "react";

type Message = {
  id: number;
  user: string;
  text: string;
  at: string;
};

export default function LiveChat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, user: "Sara", text: "Hello team 👋", at: "09:00" },
    { id: 2, user: "Omar", text: "Good morning!", at: "09:02" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: messages.length + 1,
      user: "You",
      text: input,
      at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([...messages, newMsg]);
    setInput("");
  };

  return (
    <div className="card card-p flex flex-col h-96">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-base font-semibold">Live Group Chat</h2>
        <button className="text-sm text-primary-600 hover:underline">Clear</button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 p-4">
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-medium">{m.user}: </span>
            <span>{m.text}</span>
            <span className="ml-2 text-xs text-gray-400">{m.at}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t p-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 rounded border px-3 py-2 text-sm input-focus"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}