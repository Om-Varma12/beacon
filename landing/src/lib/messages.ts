/**
 * Returns a dynamic community progress message based on the unique applicant count.
 */
export function getCommunityProgressMessage(uniqueCount: number): string {
  if (uniqueCount === 0) return "Nobody has joined yet. This is your chance to become User #1 and claim eternal bragging rights.";
  if (uniqueCount === 1) return "Yeeee! We got our first builder. You might be the next legend.";
  if (uniqueCount === 2) return "Two curious minds have already joined. Coincidence? We think not.";
  if (uniqueCount === 3) return "The founding trio has assembled. One more and we'll call it a movement.";
  if (uniqueCount === 4) return "Four early adopters are already here. The cool kids are arriving suspiciously fast.";
  if (uniqueCount === 5) return "Five builders in. At this rate we may accidentally launch a real product.";
  if (uniqueCount >= 6 && uniqueCount <= 10) return "Momentum detected. Early builders are already shaping the roadmap.";
  if (uniqueCount >= 11 && uniqueCount <= 25) return "The waitlist is growing. Future-you will be glad present-you joined now.";
  if (uniqueCount >= 26 && uniqueCount <= 50) return "People keep showing up. Either we're onto something or everyone clicked the wrong link.";
  if (uniqueCount >= 51 && uniqueCount <= 100) return "Over 50 builders have joined the mission. Things are getting interesting.";
  if (uniqueCount >= 101 && uniqueCount <= 250) return "The community is growing faster than our sleep schedule.";
  if (uniqueCount >= 251 && uniqueCount <= 500) return "Hundreds of builders are already here. We should probably keep building.";
  if (uniqueCount >= 501 && uniqueCount <= 1000) return "This started as an idea. Now it's becoming a crowd.";
  return "Over a thousand builders are waiting. No pressure... but expectations are now officially terrifying.";
}
