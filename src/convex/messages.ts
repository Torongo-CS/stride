import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';

export const listByChat = query({
  args: {
    chatId: v.id('chats'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const q = ctx.db
      .query('messages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId))
      .order('asc');
    return args.limit ? await q.take(args.limit) : await q.collect();
  },
});

export const send = mutation({
  args: {
    chatId: v.id('chats'),
    senderId: v.id('users'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('messages', {
      ...args,
      sentAt: Date.now(),
    });
  },
});

export const edit = mutation({
  args: { id: v.id('messages'), content: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { content: args.content });
  },
});

export const remove = mutation({
  args: { id: v.id('messages') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const broadcast = mutation({
  args: {
    senderId: v.id('users'),
    content: v.string(),
    role: v.optional(v.union(v.literal('admin'), v.literal('teacher'), v.literal('student'))),
  },
  handler: async (ctx, args) => {
    let usersQuery = ctx.db.query('users');
    if (args.role) {
      usersQuery = usersQuery.filter((q) => q.eq(q.field('role'), args.role));
    }
    const users = await usersQuery.collect();
    const now = Date.now();

    for (const user of users) {
      if (user._id === args.senderId) continue;

      // Find or create DM chat
      // We'll look for a chat where both are members
      // For simplicity in broadcast, we'll just create a new "Broadcast" chat
      // or find a chat named "Announcements"
      // Actually, let's do it properly: find/create a DM between sender and user

      let chatId: Id<'chats'> | null = null;

      // Look for existing DM
      const senderMemberships = await ctx.db
        .query('chatMembers')
        .withIndex('by_user', (q) => q.eq('userId', args.senderId))
        .collect();

      for (const m of senderMemberships) {
        const otherMember = await ctx.db
          .query('chatMembers')
          .withIndex('by_chat', (q) => q.eq('chatId', m.chatId))
          .filter((q) => q.eq(q.field('userId'), user._id))
          .first();

        if (otherMember) {
          // Check if it's exactly 2 members
          const allMembers = await ctx.db
            .query('chatMembers')
            .withIndex('by_chat', (q) => q.eq('chatId', m.chatId))
            .collect();
          if (allMembers.length === 2) {
            chatId = m.chatId;
            break;
          }
        }
      }

      if (!chatId) {
        chatId = await ctx.db.insert('chats', {
          name: `DM: ${user.name}`,
          createdAt: now,
        });
        await ctx.db.insert('chatMembers', { chatId, userId: args.senderId, joinedAt: now });
        await ctx.db.insert('chatMembers', { chatId, userId: user._id, joinedAt: now });
      }

      await ctx.db.insert('messages', {
        chatId,
        senderId: args.senderId,
        content: args.content,
        sentAt: now,
      });
    }
  },
});
