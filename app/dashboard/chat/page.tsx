"use client";

import { useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

type Message = {
  sender: string;
  message: string;
};

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const roomId = "ride-123"; // Replace with dynamic ride ID
  const { messages, sendMessage, isConnected } = useSocket(roomId); // Add isConnected

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message, "You"); // Send message as the user
      setMessage("");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-lg mx-auto bg-white dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center text-gray-900 dark:text-gray-100">
            <MessageSquare className="mr-2" /> Chat with Driver
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          {!isConnected && (
            <p className="text-red-500 text-sm">Disconnected from server. Trying to reconnect...</p>
          )}

          {/* Chat Messages */}
          <div className="h-64 overflow-y-auto border p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            {messages.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((msg: Message, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg ${
                    msg.sender === "You"
                      ? "bg-blue-100 dark:bg-green-800 text-right" // Changed dark blue to dark green
                      : "bg-gray-100 dark:bg-gray-700 text-left"
                  } mb-2`}
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{msg.sender}</p>
                  <p className="text-gray-700 dark:text-gray-300">{msg.message}</p>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
            />
            <Button
              onClick={handleSend}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-green-700 dark:hover:bg-green-800 text-white" // Changed dark blue to dark green
            >
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}