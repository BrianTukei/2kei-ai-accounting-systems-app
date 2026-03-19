import React, { useState } from "react";

export default function EmailModal({ onSend, onClose }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  return (
    <div className="modal">
      <h3>Send Message</h3>
      <input
        placeholder="Subject"
        value={subject}
        onChange={e => setSubject(e.target.value)}
      />
      <textarea
        placeholder="Message"
        value={message}
        onChange={e => setMessage(e.target.value)}
      />
      <button onClick={() => onSend(subject, message)}>Send</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
}
