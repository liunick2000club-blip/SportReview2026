export async function sendDingTalkMessage(content: string) {
  const webhookUrl = process.env.DINGTALK_WEBHOOK_URL;
  const keyword = process.env.DINGTALK_KEYWORD || "LiuNick";

  if (!webhookUrl || webhookUrl.includes("YOUR_ACCESS_TOKEN")) {
    console.warn("DingTalk Webhook URL is not configured.");
    return;
  }

  // 钉钉要求内容包含设置的“自定义关键词”
  const fullMessage = `[${keyword}]\n${content}`;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        msgtype: "text",
        text: {
          content: fullMessage,
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
