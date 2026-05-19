import { query } from './_generated/server';

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    // 1. Fetch total counts
    const users = await ctx.db.query('users').collect();
    const sections = await ctx.db.query('sections').collect();
    const activities = await ctx.db.query('activities').collect();
    const problems = await ctx.db.query('problems').collect();
    const submissions = await ctx.db.query('submissions').collect();
    const posts = await ctx.db.query('posts').collect();
    const comments = await ctx.db.query('comments').collect();

    // 2. Compute user role distribution
    const userRoles = {
      admin: users.filter((u) => u.role === 'admin').length,
      teacher: users.filter((u) => u.role === 'teacher').length,
      student: users.filter((u) => u.role === 'student').length,
    };

    // 3. Compute activity type distribution
    const activityTypes = {
      exam: activities.filter((a) => a.type === 'exam').length,
      class: activities.filter((a) => a.type === 'class').length,
    };

    // 4. Compute submission verdict distribution
    const submissionVerdicts: Record<string, number> = {};
    for (const sub of submissions) {
      const verdict = sub.judgeVerdict || 'Pending';
      submissionVerdicts[verdict] = (submissionVerdicts[verdict] || 0) + 1;
    }

    // 5. Get recent users (latest 5)
    const sortedUsers = [...users].sort((a, b) => b.createdAt - a.createdAt);
    const recentUsers = sortedUsers.slice(0, 5).map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatarUrl: u.avatarUrl,
      createdAt: u.createdAt,
    }));

    // 6. Get recent submissions (latest 5) with user & problem details
    const sortedSubmissions = [...submissions].sort((a, b) => b.submittedAt - a.submittedAt);
    const recentSubmissionsRaw = sortedSubmissions.slice(0, 5);
    const recentSubmissions = await Promise.all(
      recentSubmissionsRaw.map(async (sub) => {
        const author = await ctx.db.get(sub.authorId);
        const problem = await ctx.db.get(sub.problemId);
        return {
          _id: sub._id,
          authorName: author?.name || 'Unknown',
          authorAvatarUrl: author?.avatarUrl,
          problemTitle: problem?.title || 'Unknown Problem',
          verdict: sub.judgeVerdict || 'Pending',
          submittedAt: sub.submittedAt,
        };
      }),
    );

    // 7. Get submissions over time (last 7 days)
    const last7Days = Array.from({ length: 7 })
      .map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        return {
          dateStr: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          timestampStart: d.getTime(),
          timestampEnd: d.getTime() + 24 * 60 * 60 * 1000,
          count: 0,
        };
      })
      .reverse();

    for (const sub of submissions) {
      for (const day of last7Days) {
        if (sub.submittedAt >= day.timestampStart && sub.submittedAt < day.timestampEnd) {
          day.count++;
          break;
        }
      }
    }

    return {
      counts: {
        users: users.length,
        sections: sections.length,
        activities: activities.length,
        problems: problems.length,
        submissions: submissions.length,
        posts: posts.length,
        comments: comments.length,
      },
      userRoles,
      activityTypes,
      submissionVerdicts,
      recentUsers,
      recentSubmissions,
      submissionTrend: last7Days.map((day) => ({
        label: day.dateStr,
        value: day.count,
      })),
    };
  },
});
