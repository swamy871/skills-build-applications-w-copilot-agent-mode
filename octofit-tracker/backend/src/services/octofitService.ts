import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

type RecordInput = Record<string, unknown>;

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function asText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(_input: unknown) {
  const input = (_input && typeof _input === 'object' ? _input : {}) as RecordInput;
  const userId = input.userId;
  const teamId = input.teamId;
  const type = asText(input.type);
  const minutes = typeof input.minutes === 'number' ? input.minutes : Number(input.minutes);

  if (!isObjectId(userId) || !isObjectId(teamId)) throw badRequest('Valid userId and teamId are required');
  if (!type) throw badRequest('A valid activity type is required');
  if (!Number.isFinite(minutes) || minutes < 1) throw badRequest('Minutes must be a positive number');

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  if (!team) throw Object.assign(new Error('Team not found'), { status: 404 });

  return Activity.create({
    user: user._id,
    team: team._id,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(_input: unknown) {
  const input = (_input && typeof _input === 'object' ? _input : {}) as RecordInput;
  const name = asText(input.name);
  const mascot = asText(input.mascot);
  if (!name) throw badRequest('A team name is required');
  if (!mascot) throw badRequest('A team mascot is required');

  const members = Array.isArray(input.members) ? input.members : [];
  if (members.some((member) => !isObjectId(member))) throw badRequest('Every member must have a valid user ID');
  if (members.length) {
    const count = await User.countDocuments({ _id: { $in: members } });
    if (count !== new Set(members.map((member) => String(member))).size) {
      throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
    }
  }
  return Team.create({ name, mascot, members });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);
  const teamIds = totals.map((entry) => entry._id);
  const teams = await Team.find({ _id: { $in: teamIds } }).lean();
  const teamNames = new Map(teams.map((team) => [team._id.toString(), team.name]));
  const entries = totals
    .filter((entry) => teamNames.has(entry._id?.toString()))
    .map((entry) => ({
      teamName: teamNames.get(entry._id.toString()),
      totalPoints: entry.totalPoints,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.teamName!.localeCompare(b.teamName!))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
  return entries;
}

export async function suggestWorkouts(_userEmail: string) {
  const email = asText(_userEmail);
  if (!email) throw badRequest('A valid user email is required');
  const user = await User.findOne({ email: email.toLowerCase() }).lean();
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const recent = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const activityFocus = recent?.type.toLowerCase();
  const focusMap: Record<string, string> = {
    run: 'endurance',
    cycle: 'endurance',
    walk: 'mobility',
    strength: 'strength',
  };
  const goal = typeof user.fitnessGoal === 'string' ? user.fitnessGoal.toLowerCase() : '';
  const focus = (activityFocus && focusMap[activityFocus]) ?? goal;

  const suggestions = await Workout.find({
    $or: [{ focus }, ...(focus ? [{ focus: goal }] : [])],
  }).lean();

  return suggestions.map((workout) => ({
    ...workout,
    reason: recent
      ? `Selected for ${recent.type} activity and your ${goal || focus} goal`
      : `Selected for your ${goal || focus} goal`,
  })).sort((a, b) => (a.focus === focus ? -1 : 1) - (b.focus === focus ? -1 : 1));
}

export { User };
