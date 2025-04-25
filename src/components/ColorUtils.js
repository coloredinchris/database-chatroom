// src/components/ColorUtils.js
export const getAdjustedColor = (baseColor, isDarkMode) => {
    const usernameColorMap = {
      "#00D0E0": { light: "#00D0E0", dark: "#144AB7" },
      "#00D0F0": { light: "#00D0F0", dark: "#324CCC" },
      "#00E000": { light: "#00E000", dark: "#2D606B" },
      "#00E060": { light: "#00E060", dark: "#0F6089" },
      "#CBCC32": { light: "#CBCC32", dark: "#8E4A3D" },
      "#99D65B": { light: "#99D65B", dark: "#6B562D" },
      "#26D8D8": { light: "#26D8D8", dark: "#324CCC" },
      "#DBC1BC": { light: "#DBC1BC", dark: "#8E3D8E" },
      "#EFD175": { light: "#EFD175", dark: "#99337F" },
      "#D6D65B": { light: "#D6D65B", dark: "#993366" },
    };
  
    return isDarkMode
      ? usernameColorMap[baseColor]?.dark || baseColor
      : usernameColorMap[baseColor]?.light || baseColor;
  };
  
  export const formatMessage = (msg) => {
    let messageContent = msg.message || msg.content || "";
  
    messageContent = messageContent.replace(/@([^\s]+)/g, (match, username) => {
      if (msg.validUsernames?.includes(username)) {
        return `<span class="highlight-mention">@${username}</span>`;
      }
      return match;
    });
  
    messageContent = messageContent.replace(
      /\b\w+[-\w]*\.(txt|jpg|jpeg|png|gif|mp4|mov|avi|webm|pdf|docx|xlsx|html|css|js|json|xml|py|java|c|cpp|h|zip|rar|7z|tar|gz)\b/gi,
      (match) => `<span class="highlight-file">${match}</span>`
    );
  
    messageContent = messageContent.replace(
      /\b((https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?)\b/gi,
      (match) => {
        if (!/\b\w+\.(txt|jpg|jpeg|png|gif|mp4|mov|avi|webm|pdf|docx|xlsx|html|css|js|json|xml|py|java|c|cpp|h|zip|rar|7z|tar|gz)\b/i.test(match)) {
          const url = match.startsWith("http") ? match : `http://${match}`;
          return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="highlight-link">${match}</a>`;
        }
        return match;
      }
    );
  
    messageContent = messageContent.replace(/#(.*?)#/g, (_, text) => `<span class="highlight-hashtag">${text}</span>`);
    messageContent = messageContent.replace(/!(.*?)!/g, (_, text) => `<span class="highlight-exclamation">${text}</span>`);
    messageContent = messageContent.replace(/\$(.*?)\$/g, (_, text) => `<span class="highlight-dollar">${text}</span>`);
    messageContent = messageContent.replace(/~(.*?)~/g, (_, text) => `<span class="highlight-tilde">${text}</span>`);
  
    return messageContent;
  };
  