import { Activity, Team, User, Workout } from '../models/index.js';

type InputRecord = Record<string, unknown>;

function isRecord(input: unknown): input is InputRecord {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function requiredString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Activity details are required');
  const { userId, teamId, type, minutes } = input;
  if (!requiredString(userId) || !requiredString(teamId) || !requiredString(type)
    || typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    throw httpError(400, 'A valid user, team, activity type, and positive minutes are required');
  }
  if (!User.db.base.isObjectIdOrHexString(userId) || !User.db.base.isObjectIdOrHexString(teamId)) {
    throw httpError(400, 'User and team IDs must be valid');
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw httpError(404, 'The specified user or team does not exist');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input) || !requiredString(input.name) || !requiredString(input.mascot)) {
    throw httpError(400, 'A team name and mascot are required');
  }

  const rawMemberIds = input.members ?? [];
  if (!Array.isArray(rawMemberIds)) throw httpError(400, 'Team members must be an array of user IDs');
  const memberIds: string[] = [];
  for (const memberId of rawMemberIds) {
    if (typeof memberId !== 'string' || !User.db.base.isObjectIdOrHexString(memberId)) {
      throw httpError(400, 'Team members must be valid user IDs');
    }
    memberIds.push(memberId);
  }
  const uniqueMemberIds = [...new Set(memberIds)];
  if (uniqueMemberIds.length > 0) {
    const members = await User.find({ _id: { $in: uniqueMemberIds } }).select('_id').lean();
    if (members.length !== uniqueMemberIds.length) throw httpError(404, 'One or more team members do not exist');
  }

  return Team.create({
    name: input.name.trim(),
    mascot: input.mascot.trim(),
    members: uniqueMemberIds,
  });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate<{ _id: unknown; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const totalsByTeam = new Map(totals.map(({ _id, totalPoints }) => [String(_id), totalPoints]));
  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: totalsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.teamName.localeCompare(b.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw httpError(404, 'No user was found for that email address');

  const [recentActivity, workouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean(),
    Workout.find().lean(),
  ]);
  const normalizeFocus = (value: string | undefined) => {
    const normalized = value?.trim().toLowerCase();
    if (!normalized) return undefined;
    if (['run', 'running', 'cycle', 'cycling', 'walk', 'walking', 'cardio'].includes(normalized)) return 'endurance';
    if (['weightlifting', 'weights'].includes(normalized)) return 'strength';
    return normalized;
  };
  const goalFocus = normalizeFocus(user.fitnessGoal);
  const activityFocus = normalizeFocus(recentActivity?.type);
  const targetFocus = [goalFocus, activityFocus].find((focus) =>
    focus && workouts.some((workout) => workout.focus.toLowerCase() === focus));
  const reason = targetFocus === goalFocus && goalFocus
    ? `Recommended for your ${goalFocus} goal.`
    : recentActivity
      ? `Based on your recent ${recentActivity.type} activity.`
      : 'Selected from the available workouts.';

  return workouts
    .map((workout) => ({
      ...workout,
      reason: workout.focus.toLowerCase() === targetFocus
        ? reason
        : `A ${workout.focus} workout to complement your fitness routine.`,
    }))
    .sort((a, b) => Number(b.focus.toLowerCase() === targetFocus) - Number(a.focus.toLowerCase() === targetFocus));
}

export { User };
