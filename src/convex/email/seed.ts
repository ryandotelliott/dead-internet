import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

export const seedEmails = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const users = [
      { name: "Raymond Cosgrove", email: "raymond.cosgrove@gmail.com" },
      { name: "Harris Rothaermel", email: "harris.rothaermel@gmail.com" },
      { name: "Amy Park", email: "amy.park@gmail.com" },
      { name: "Ryan Elliott", email: "ryan.elliott@gmail.com" },
      { name: "Devin Ramsammy", email: "devin.ramsammy@gmail.com" },
      { name: "Elena Thornton", email: "elena.thornton@gmail.com" },
      { name: "Pallav Agarwal", email: "pallav.agarwal@gmail.com" },
      { name: "Sterling Cole", email: "sterling.cole@gmail.com" },
    ];

    const userIds: Id<"users">[] = [];
    for (const user of users) {
      const userId = await ctx.db.insert("users", user);
      userIds.push(userId);
    }

    const emails = [
      {
        from: userIds[0],
        to: [userIds[1]],
        subject: "Project Update Meeting",
        body: "Hi Harris,\n\nCan we schedule a quick meeting to discuss the latest updates on the Dead Internet project? I have some interesting findings from our research that I'd like to share.",
      },
      {
        from: userIds[1],
        to: [userIds[0]],
        subject: "Re: Project Update Meeting",
        body: "Hi Raymond,\n\nSounds good! How about tomorrow at 3 PM? I can share my latest analysis on user engagement patterns.",
      },
      {
        from: userIds[2],
        to: [userIds[0], userIds[1]],
        subject: "Technical Architecture Review",
        body: "Hi team,\n\nI've completed the technical review of our current architecture. The good news is that our Convex backend is performing well under load. However, I noticed some opportunities for optimization in our query patterns.\n\nLet me know if you'd like me to schedule a demo.",
      },
      {
        from: userIds[3],
        to: [userIds[4]],
        subject: "UI/UX Feedback Session",
        body: "Hey,\n\nLoved the new design mockups! The user flow feels much more intuitive now. Can we hop on a call tomorrow to discuss the implementation details?\n\nAlso, I noticed the loading states could use some polish - maybe we can add some micro-interactions?",
      },
      {
        from: userIds[4],
        to: [userIds[3]],
        subject: "Re: UI/UX Feedback Session",
        body: "Hey,\n\nThanks for the feedback! I'm glad you like the direction. Tomorrow works for me - let's aim for 2 PM.\n\nRegarding the loading states, I completely agree. I've been working on a set of loading animations that should really elevate the experience.\n\nLooking forward to our chat!",
      },
      {
        from: userIds[5],
        to: [userIds[6], userIds[7]],
        subject: "Research Collaboration Opportunity",
        body: "Dear everyone,\n\nI hope this email finds you well. I'm currently conducting research on digital communication patterns and would love to collaborate with your organizations.\n\nGiven your work in consulting and non-profits respectively, I think we could create some really interesting insights together.\n\nWould you be open to a brief introductory call?",
      },
      {
        from: userIds[6],
        to: [userIds[5]],
        subject: "Re: Research Collaboration Opportunity",
        body: "Hi,\n\nThank you for reaching out! Your research sounds fascinating and definitely aligns with some of the work we're doing with our clients.\n\nI'd be happy to discuss potential collaboration opportunities. How about next Tuesday at 11 AM?",
      },
      {
        from: userIds[7],
        to: [userIds[5]],
        subject: "Re: Research Collaboration Opportunity",
        body: "Hi,\n\nThis is very timely! We've been looking for ways to better understand our community's digital engagement patterns.\n\nI'm definitely interested in learning more about your research. Would you be available for a call next week?",
      },
      {
        from: userIds[0],
        to: [userIds[2], userIds[3], userIds[4]],
        subject: "Team Standup - Tomorrow 10 AM",
        body: "Hi everyone,\n\nJust a reminder about our team standup tomorrow at 10 AM. We'll cover:\n\n- Project milestones\n- Current blockers\n- Next sprint planning\n\nPlease come prepared with your updates!\n\nRaymond",
      },
      {
        from: userIds[1],
        to: [userIds[0], userIds[2]],
        subject: "Data Analysis Results",
        body: "Hi everyone,\n\nI've finished analyzing the user behavior data from the past month. The results are quite revealing:\n\n- 73% increase in engagement\n- 45% reduction in bounce rate\n- Strong correlation between feature adoption and retention\n\nI'll prepare a detailed report with recommendations.\n\nHarris",
      },
    ];

    for (const email of emails) {
      await ctx.db.insert("emailMessages", email);
    }

    return null;
  },
});
