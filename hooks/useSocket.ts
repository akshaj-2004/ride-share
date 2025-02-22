import { useEffect, useState } from "react";

type Message = {
  sender: string;
  message: string;
};

/**
 * Custom hook to simulate a live chat without a backend.
 * @param roomId - The room ID to join (e.g., ride-123).
 * @returns { messages, sendMessage, clearMessages, isConnected } - Messages array, a function to send messages, a function to clear messages, and connection status.
 */
export const useSocket = (roomId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(true); // Simulate connection status

  /**
   * Send a message to the mock chat room.
   * @param message - The message text.
   * @param sender - The sender's name (e.g., "You").
   */
  const sendMessage = (message: string, sender: string) => {
    if (isConnected) {
      // Simulate receiving a message after sending
      setTimeout(() => {
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender, message },
        ]);
      }, 100); // Simulate a small delay
    } else {
      console.error("Socket is not connected. Unable to send message.");
    }
  };

  /**
   * Clear all messages in the chat room.
   */
  const clearMessages = () => {
    setMessages([]); // Reset the messages array to empty
  };

  // Simulate joining a room
  useEffect(() => {
    console.log(`Joined room: ${roomId}`);
    setIsConnected(true);

    // Simulate receiving a welcome message
    setTimeout(() => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "System", message: `Welcome to the chat room: ${roomId}` },
      ]);
    }, 500);

    // Cleanup on unmount
    return () => {
      console.log(`Left room: ${roomId}`);
      setIsConnected(false);
    };
  }, [roomId]);

  return { messages, sendMessage, clearMessages, isConnected };
};