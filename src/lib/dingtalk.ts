export async function sendDingTalkMessage(title: string, text: string) {
  const webhookUrl = process.env.DINGTALK_WEBHOOK_URL;
  const keyword = process.env.DINGTALK_KEYWORD || "LiuNick";

  if (!webhookUrl || webhookUrl.includes("YOUR_ACCESS_TOKEN")) {
    console.warn("DingTalk Webhook URL is not configured.");
    return;
  }

  // 钉钉要求内容包含设置的“自定义关键词”
  // 在 Markdown 中，关键字必须出现在标题或文本中
  const fullTitle = `[${keyword}] ${title}`;
  const fullText = `### ${keyword} 通知\n---\n${text}`;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        msgtype: "markdown",
        markdown: {
          title: fullTitle,
          text: fullText,
        },
      }),
    });

    const result = await response.json();
    if (result.errcode !== 0) {
      console.error("DingTalk Error:", result.errmsg);
    }
    return result;
  } catch (error) {
    console.error("Failed to send DingTalk message:", error);
  }
}
