'use client';

import { useState } from 'react';
// import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Court, Player } from '@/lib/api/types';
import { Button } from '@chakra-ui/react';
import { Clock, Play, Square, User } from 'lucide-react';
import { useLevelLabel } from '@/hooks/useLevelLabel';

export function CourtCard({
  court,
  availablePlayers,
  onSelectPlayers,
  onStartMatch,
  onEndMatch,
}: {
  court: Court;
  availablePlayers?: Player[];
  onSelectPlayers?: (courtId: string) => void;
  onStartMatch?: (courtId: string) => void;
  onEndMatch?: (courtId: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>Court {court.courtNumber}</span>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              court.status === 'IN_USE'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {court.status === 'IN_USE' ? 'In Use' : 'Empty'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {court.status === 'IN_USE' && court.currentMatch ? (
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-md">
              <h4 className="text-sm font-medium mb-2">Current Match</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Started:</div>
                <div>
                  {new Date(court.currentMatch.startTime).toLocaleTimeString(
                    [],
                    { hour: '2-digit', minute: '2-digit' }
                  )}
                </div>

                <div className="text-muted-foreground">Duration:</div>
                <div>
                  {Math.floor(
                    (new Date().getTime() -
                      new Date(court.currentMatch.startTime).getTime()) /
                      60000
                  )}{' '}
                  min
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Players</h4>
              {court.currentPlayers && court.currentPlayers.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {court.currentPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="bg-background border rounded-md p-2 text-sm"
                    >
                      #{player.playerNumber} - {player.name || 'Player'}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No players assigned
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-muted p-4 rounded-md text-center mb-4">
            <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No active match</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {court.status === 'EMPTY' ? (
          <Button
            className="w-full"
            onClick={() => onSelectPlayers && onSelectPlayers(court.id)}
            disabled={!availablePlayers || availablePlayers.length < 4}
          >
            Select Players
          </Button>
        ) : court.currentMatch &&
          court.currentMatch.status === 'IN_PROGRESS' ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onEndMatch && onEndMatch(court.id)}
          >
            <Square className="mr-2 h-4 w-4" /> End Match
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={() => onStartMatch && onStartMatch(court.id)}
            disabled={!court.currentPlayers || court.currentPlayers.length < 4}
          >
            <Play className="mr-2 h-4 w-4" /> Start Match
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export function CourtList({
  courts,
  availablePlayers,
  onSelectPlayers,
  onStartMatch,
  onEndMatch,
}: {
  courts: Court[];
  availablePlayers?: Player[];
  onSelectPlayers?: (courtId: string) => void;
  onStartMatch?: (courtId: string) => void;
  onEndMatch?: (courtId: string) => void;
}) {
  if (!courts || courts.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <p className="text-muted-foreground">No courts available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {courts.map((court) => (
        <CourtCard
          key={court.id}
          court={court}
          availablePlayers={availablePlayers}
          onSelectPlayers={onSelectPlayers}
          onStartMatch={onStartMatch}
          onEndMatch={onEndMatch}
        />
      ))}
    </div>
  );
}

export function SelectPlayersModal({
  court,
  availablePlayers,
  onSelect,
  onCancel,
}: {
  court: Court;
  availablePlayers: Player[];
  onSelect: (courtId: string, playerIds: string[]) => void;
  onCancel: () => void;
}) {
  const getLevelLabel = useLevelLabel();
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  const togglePlayer = (playerId: string) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter((id) => id !== playerId));
    } else {
      if (selectedPlayers.length < 4) {
        setSelectedPlayers([...selectedPlayers, playerId]);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-auto">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">
            Select Players for Court {court.courtNumber}
          </h2>
          <p className="text-sm text-muted-foreground">
            Select 4 players for this court
          </p>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span>Available Players</span>
              <span>{selectedPlayers.length}/4 selected</span>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto">
              {availablePlayers.map((player) => (
                <div
                  key={player.id}
                  className={`p-3 rounded-md border cursor-pointer transition-colors ${
                    selectedPlayers.includes(player.id)
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => togglePlayer(player.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        #{player.playerNumber} -{' '}
                        {player.name || 'Unnamed Player'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {player.level ? getLevelLabel(player.level) : 'N/A'} •
                      Wait: {player.currentWaitTime}m
                    </div>
                  </div>
                </div>
              ))}

              {availablePlayers.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No players available
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-muted/50 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={() => onSelect(court.id, selectedPlayers)}
            disabled={selectedPlayers.length !== 4}
          >
            Assign to Court
          </Button>
        </div>
      </div>
    </div>
  );
}
