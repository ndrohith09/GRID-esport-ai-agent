import React, { useState } from "react";
import { Input, Button, Avatar, Flex, Typography } from "antd";
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ChatInput from "./InputField";

const { Text } = Typography;
const markdown = `# Just a link: 
www.nasa.gov.`;

const ChatGUI: React.FC = () => {
  const [messages, setMessages] = useState([
    { role: "user", text: "Agent active. Chat contained within panel." },
    { role: "ai", text: "Agent active. Chat contained within panel." },
  ]);

  return (
    /* h-full and flex-col are critical here to stay inside the Splitter */
    <div className="h-full w-full bg-white flex flex-col relative overflow-hidden">
      {/* 1. Header (Fixed at top of panel) */}
      <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200 flex-none bg-white z-10">
        <Text className="text-[9px] tracking-[2px] font-bold text-black uppercase">
          Valorant AI Agent
        </Text>
      </div>

      {/* 2. Scrollable Messages Area */}
      {/* 2. Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
        <div className="w-full space-y-4">
          {messages.map((msg, i) => {
            const isAI = msg.role === "ai";

            return (
              <div
                key={i}
                className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full ${
                  isAI ? "flex-row" : "flex-row-reverse"
                }`}
              >
                {/* 1. Avatar - Now strictly aligned to the top of the first line */}
                <div
                  className={`flex-none h-7 w-7 mt-1 flex items-center justify-center rounded-lg ${
                    isAI ? "bg-black text-white" : "bg-gray-100 text-black"
                  }`}
                >
                  {isAI ? (
                    <RobotOutlined style={{ fontSize: "14px" }} />
                  ) : (
                    <UserOutlined style={{ fontSize: "14px" }} />
                  )}
                </div>

                {/* 2. Message Wrapper */}
                <div
                  className={`flex flex-col ${isAI ? "items-start flex-1" : "items-end max-w-[80%]"}`}
                >
                  {/* 3. The Bubble */}
                  <div
                    className={`text-sm leading-relaxed transition-all ${
                      isAI
                        ? "text-gray-800 bg-transparent py-1 w-full"
                        : "bg-gray-50 text-gray-700 py-2.5 px-4 rounded-2xl rounded-tr-none border border-gray-100"
                    }`}
                  >
                    {isAI ? (
                      <div
                        className="prose prose-xs max-w-none text-gray-800 text-sm
                prose-headings:text-black prose-headings:font-bold prose-headings:my-2
                prose-h1:text-sm prose-h1:tracking-wide prose-h1:uppercase
                prose-h2:text-xs prose-h2:tracking-wider
                prose-h3:text-xs
                prose-p:leading-relaxed prose-p:my-1
                prose-pre:bg-gray-900 prose-pre:text-white prose-pre:p-2"
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Input Area (Pinned to bottom of panel, NOT screen) */}
          <ChatInput />
    </div>
  );
};

export default ChatGUI;
