import { useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Card } from '../../components/shared/Card';
import { Badge } from '../../components/shared/Badge';
import { useAuthStore } from '../../store/authStore';
import { mockBatches, mockLeaderboards, mockInstituteLeaderboard } from '../../data/mockData';
import type { LeaderboardEntry } from '../../types';
import { Trophy, Medal, Star, Users } from 'lucide-react';

export function StudentLeaderboard() {
  const { user } = useAuthStore();
  const myBatches = mockBatches.filter((b) => user?.batchIds?.includes(b.id));
  const [selectedBatch, setSelectedBatch] = useState<'institute' | string>('institute');

  const currentRankings: LeaderboardEntry[] =
    selectedBatch === 'institute'
      ? mockInstituteLeaderboard
      : mockLeaderboards[selectedBatch]?.rankings || [];

  const myEntry = currentRankings.find((r) => r.studentId === user?.uid);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="text-yellow-500" size={20} />;
    if (rank === 2) return <Medal className="text-slate-400" size={20} />;
    if (rank === 3) return <Medal className="text-amber-700" size={20} />;
    return <span className="text-slate-500 font-bold text-sm w-5 text-center">#{rank}</span>;
  };

  const getRankBg = (rank: number, isMe: boolean) => {
    if (isMe) return 'bg-purple-50 border-purple-300 border-2';
    if (rank === 1) return 'bg-yellow-50 border-yellow-200';
    if (rank === 2) return 'bg-slate-50 border-slate-200';
    if (rank === 3) return 'bg-amber-50 border-amber-200';
    return 'bg-white border-slate-100';
  };

  return (
    <AppLayout role="student" title="Leaderboard">
      {/* My Rank Card */}
      {myEntry && (
        <Card className="mb-5 bg-gradient-to-r from-[#4a1a5e] to-[#6b2a8c] border-0 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Your Current Rank</p>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-4xl font-bold">#{myEntry.rank}</p>
                <div>
                  <p className="font-semibold">{myEntry.totalScore} total marks</p>
                  <p className="text-white/70 text-xs">
                    {myEntry.examsTaken} exams • {myEntry.avgScore.toFixed(1)} avg
                  </p>
                </div>
              </div>
            </div>
            <Star size={48} className="text-white/20" />
          </div>
        </Card>
      )}

      {/* Scope Selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedBatch('institute')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedBatch === 'institute' ? 'bg-[#4a1a5e] text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          <Users size={14} />
          Institute-wide
        </button>
        {myBatches.map((batch) => (
          <button
            key={batch.id}
            onClick={() => setSelectedBatch(batch.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedBatch === batch.id ? 'bg-[#4a1a5e] text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {batch.name.split('—')[0].trim()}
          </button>
        ))}
      </div>

      {/* Rankings */}
      <Card padding="none">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">
            {selectedBatch === 'institute'
              ? 'Institute Rankings'
              : mockBatches.find((b) => b.id === selectedBatch)?.name}
          </h3>
          <span className="text-xs text-slate-400">{currentRankings.length} students</span>
        </div>

        {currentRankings.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-400 text-sm">
            No rankings available yet. Complete exams to appear on the leaderboard.
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {currentRankings.map((entry) => {
              const isMe = entry.studentId === user?.uid;
              return (
                <div
                  key={entry.studentId}
                  className={`flex items-center gap-4 px-4 py-3.5 border-l-2 transition-all ${isMe ? 'border-purple-500' : 'border-transparent'} ${getRankBg(entry.rank, isMe)}`}
                >
                  {/* Rank */}
                  <div className="w-8 flex items-center justify-center flex-shrink-0">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${isMe ? 'bg-purple-600 text-white' : 'bg-gradient-to-br from-slate-300 to-slate-400 text-white'}`}
                  >
                    {entry.studentName.charAt(0)}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm font-semibold truncate ${isMe ? 'text-purple-900' : 'text-slate-900'}`}
                      >
                        {entry.studentName}
                      </p>
                      {isMe && (
                        <Badge variant="default" size="sm">
                          You
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {entry.examsTaken} exam{entry.examsTaken !== 1 ? 's' : ''} • Avg{' '}
                      {entry.avgScore.toFixed(1)}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-base font-bold ${isMe ? 'text-purple-700' : 'text-slate-900'}`}
                    >
                      {entry.totalScore}
                    </p>
                    <p className="text-xs text-slate-400">pts</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Legend */}
      <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
        <p className="font-medium text-slate-700 mb-1">About Rankings</p>
        <p>
          Rankings are based on cumulative scores across all completed exams. Tie-breaking is done
          by earliest submission time. Updated in real-time after each exam submission.
        </p>
      </div>
    </AppLayout>
  );
}
