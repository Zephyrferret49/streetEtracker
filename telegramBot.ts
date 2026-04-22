import { Telegraf, Context, session } from "telegraf";
import { STAGES } from "./src/constants.js";
import { formatContactRow, appendSheetData } from "./sheets.js";

interface MySession {
  step?: string;
  contactData?: any;
}

interface MyContext extends Context {
  session: MySession;
}

export const WEBHOOK_PATH = process.env.TELEGRAM_BOT_TOKEN 
  ? `/telegraf-webhook-${process.env.TELEGRAM_BOT_TOKEN.substring(0, 8)}`
  : "/telegraf-webhook-default";

// Helper to normalize status input
function normalizeStatus(input: string): string[] {
  const lower = input.toLowerCase().trim();
  const results: string[] = [];
  
  if (lower.includes("convo")) results.push("convo");
  if (lower.includes("pray")) results.push("pray");
  if (lower.includes("gospel")) results.push("gospel");
  if (lower.includes("exchange") || lower.includes("contact")) results.push("contact");
  if (lower.includes("salvation")) results.push("salvation");
  if (lower.includes("high priority") || lower.includes("urgent")) results.push("high-priority");
  
  // Fallback to checking if it matches any defined stage if nothing found yet
  if (results.length === 0) {
    const matched = STAGES.find(s => lower.includes(s.toLowerCase()));
    if (matched) results.push(matched);
  }
  
  return results.length > 0 ? results : [STAGES[0]];
}

// Greedy comma-based parser: treats the first 7 commas as delimiters, 
// and everything after the 7th comma as the final "remarks" field.
function parseCommaSeparated(text: string) {
  const parts: string[] = text.split(",").map(p => p.trim());
  
  let name = parts[0] || "-";
  let gender = parts[1] || "-";
  let teamMember = parts[2] || "-";
  let age = parts[3] || "-";
  let occupation = parts[4] || "-";
  let status = normalizeStatus(parts[5] || STAGES[0]);
  let highPriority = false;
  let socialMedia = "-";
  let remarks = "-";

  // If we have at least 7 parts, the 7th part (index 6) is High Priority
  if (parts.length >= 7) {
    const highPriorityText = parts[6].toLowerCase();
    highPriority = highPriorityText === "yes" || highPriorityText === "true" || highPriorityText === "y" || highPriorityText === "high priority";
    if (highPriority && !status.includes('high-priority')) {
      status.push('high-priority');
    }
  }

  // If we have at least 8 parts, the 8th part is Social Media
  if (parts.length >= 8) {
    socialMedia = parts[7] || "-";
  }

  // If we have at least 9 parts, the 9th part and everything after is Remarks
  if (parts.length >= 9) {
    remarks = parts.slice(8).join(", ");
  }

  return {
    name,
    gender,
    teamMember,
    age,
    occupation,
    status,
    highPriority,
    socialMedia,
    remarks,
  };
}

let botInstance: Telegraf<MyContext> | null = null;

export function getBot() {
  if (botInstance) return botInstance;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.trim() === "") {
    console.warn("TELEGRAM_BOT_TOKEN is missing. Telegram functionality will be disabled.");
    return null;
  }
  console.log(`Initializing Telegram bot with token prefix: ${token.substring(0, 8)}`);
  try {
    botInstance = new Telegraf<MyContext>(token);
    botInstance.use(session());
    setupBotLogic(botInstance);
    return botInstance;
  } catch (err) {
    console.error("Failed to initialize Telegram bot:", err);
    return null;
  }
}

// Move all bot logic into a setup function
function setupBotLogic(bot: Telegraf<MyContext>) {
  // Global middleware for logging
  bot.use((ctx, next) => {
    console.log(`Telegram update received: ${JSON.stringify(ctx.update, null, 2)}`);
    return next();
  });

  // Ensure session is initialized
  bot.use((ctx, next) => {
    if (!ctx.session) {
      ctx.session = {};
    }
    return next();
  });

  bot.start((ctx) => {
    ctx.reply(`Welcome! Send me a message like 'John Doe, Male, Team A, 30, Engineer, convo, no, @johndoe, Friendly and loves coffee' or type /new to start step-by-step.\n\nStatus options: convo, pray, gospel, exchange contact, salvation.`);
  });

  bot.command("version", (ctx) => {
    ctx.reply("Bot Version: 1.4.0 (Name, Gender, Team Member, Age, Occupation, Status, High Priority, Social Media, Remarks)");
  });

  bot.command("ping", (ctx) => {
    ctx.reply(`Pong! Bot is alive. \nInstance: ${process.env.K_SERVICE || "unknown"}\nRevision: ${process.env.K_REVISION || "unknown"}`);
  });

  bot.command("new", (ctx) => {
    ctx.session.step = "name";
    ctx.session.contactData = {};
    ctx.reply("What is the person's name?");
  });

  bot.command("cancel", (ctx) => {
    ctx.session.step = undefined;
    ctx.session.contactData = undefined;
    ctx.reply("Action cancelled. You can send a quick message or type /new.");
  });

  bot.on("text", async (ctx) => {
    const text = ctx.message.text;
    const session = ctx.session;

    // Ignore commands in general text handler
    if (text.startsWith("/")) return;

    console.log(`Bot received text: "${text}" (Step: ${session.step || "none"})`);

    if (session.step) {
      switch (session.step) {
        case "name":
          session.contactData.name = text;
          session.step = "gender";
          ctx.reply("Gender?");
          break;
        case "gender":
          session.contactData.gender = text;
          session.step = "teamMember";
          ctx.reply("Team Member?");
          break;
        case "teamMember":
          session.contactData.teamMember = text;
          session.step = "age";
          ctx.reply("Age?");
          break;
        case "age":
          session.contactData.age = text;
          session.step = "occupation";
          ctx.reply("Occupation?");
          break;
        case "occupation":
          session.contactData.occupation = text;
          session.step = "status";
          ctx.reply(`Status (convo, pray, gospel, exchange contact, salvation)?`);
          break;
        case "status":
          session.contactData.status = normalizeStatus(text);
          session.step = "highPriority";
          ctx.reply("High Priority? (yes/no)");
          break;
        case "highPriority":
          session.contactData.highPriority = text.toLowerCase().startsWith("y");
          if (session.contactData.highPriority && !session.contactData.status.includes('high-priority')) {
            session.contactData.status.push('high-priority');
          }
          session.step = "socialMedia";
          ctx.reply("Social Media Handle / Contact Point?");
          break;
        case "socialMedia":
          session.contactData.socialMedia = text;
          session.step = "remarks";
          ctx.reply("Greedy Remarks / Details?");
          break;
        case "remarks":
          session.contactData.remarks = text;
          const id = Date.now().toString();
          const row = formatContactRow(id, session.contactData);
          await appendSheetData(row);
          ctx.reply(`Added ${session.contactData.name} to ${session.contactData.status?.join(', ') || STAGES[0]}! ${session.contactData.highPriority ? "(High Priority)" : ""}`);
          delete session.step;
          delete session.contactData;
          break;
      }
    } else {
      // Try simple comma parsing
      const data = parseCommaSeparated(text);
      try {
        const id = Date.now().toString() + "-" + Math.floor(Math.random() * 1000);
        const row = formatContactRow(id, data);
        await appendSheetData(row);
        ctx.reply(`Added: ${data.name} to ${data.status?.join(', ') || STAGES[0]}! ${data.highPriority ? "(High Priority)" : ""}`);
      } catch (e: any) {
        console.error("Error saving data:", e.message);
        ctx.reply("Error saving to sheet. Please check your configuration.");
      }
    }
  });
}

export function launchBot() {
  const bot = getBot();
  if (!bot) return;

  if (process.env.NODE_ENV === "production" && process.env.APP_URL) {
    const baseUrl = process.env.APP_URL.trim().endsWith("/") 
      ? process.env.APP_URL.trim().slice(0, -1) 
      : process.env.APP_URL.trim();
    const webhookUrl = `${baseUrl}${WEBHOOK_PATH}`;
    
    console.log(`[Telegram] Attempting to set webhook to: ${webhookUrl}`);
    
    bot.telegram.setWebhook(webhookUrl, {
      drop_pending_updates: true // Clears any old messages that were stuck
    }).then((result) => {
      console.log(`[Telegram] Webhook set successfully: ${result}`);
    }).catch(err => {
      console.error("[Telegram] CRITICAL: Failed to set webhook:", err);
    });
  } else {
    if (process.env.NODE_ENV === "production") {
      console.warn("WARNING: APP_URL is missing in production. Falling back to Polling mode. This is NOT recommended for serverless environments like Cloud Run.");
    }
    console.log("Starting Telegram Bot in Polling mode");
    bot.launch({
      dropPendingUpdates: true
    }).catch(err => {
      if (err.message?.includes('409') || err.description?.includes('409')) {
        console.warn("[Telegram] CONFLICT (409): The bot token is likely in use by another instance (e.g., your production CLI deploy). Polling is disabled to avoid interference.");
      } else {
        console.error("[Telegram] Error launching bot in polling mode:", err);
      }
    });
  }
}
