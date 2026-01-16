import { BulkPlayerData } from '@/lib/api/types';
import { VALID_LEVELS } from '@/constants/levels';

// Function to create players from CSV data
export function parseCSVToBulkPlayers(csvData: string): BulkPlayerData[] {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim());

  return lines.slice(1).map((line, index) => {
    const values = line.split(',').map((v) => v.trim());
    const player: BulkPlayerData = {
      playerNumber: parseInt(values[0]) || index + 1,
    };

    // Map CSV columns to player fields
    headers.forEach((header, i) => {
      const value = values[i];
      if (!value) return;

      switch (header.toLowerCase()) {
        case 'name':
          player.name = value;
          break;
        case 'gender':
          player.gender = value.toUpperCase() as 'MALE' | 'FEMALE';
          break;
        case 'level':
          const parsedLevel = parseInt(value);
          if (!isNaN(parsedLevel)) {
            player.level = parsedLevel;
          }
          break;
        case 'leveldescription':
        case 'level description':
          player.levelDescription = value;
          break;
        case 'requireconfirminfo':
        case 'require confirm info':
          player.requireConfirmInfo =
            value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
          break;
        case 'phone':
          player.phone = value;
          break;
      }
    });

    return player;
  });
}

// Function to validate bulk player data
export function validateBulkPlayerData(
  playersData: BulkPlayerData[],
  availableNumbers: number[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  playersData.forEach((player, index) => {
    // Check required playerNumber
    if (!player.playerNumber) {
      errors.push(`Player ${index + 1}: playerNumber is required`);
    }

    // Check if playerNumber is available
    if (
      player.playerNumber &&
      !availableNumbers.includes(player.playerNumber)
    ) {
      errors.push(
        `Player ${index + 1}: playerNumber ${
          player.playerNumber
        } is not available`
      );
    }

    // Check duplicate playerNumbers in the data
    const duplicates = playersData.filter(
      (p) => p.playerNumber === player.playerNumber
    );
    if (duplicates.length > 1) {
      errors.push(
        `Player ${index + 1}: duplicate playerNumber ${player.playerNumber}`
      );
    }

    // Validate gender if provided
    if (player.gender && !['MALE', 'FEMALE'].includes(player.gender)) {
      errors.push(`Player ${index + 1}: invalid gender "${player.gender}"`);
    }

    // Validate level if provided
    if (player.level !== undefined && !VALID_LEVELS.includes(player.level)) {
      errors.push(`Player ${index + 1}: invalid level "${player.level}"`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Example CSV format
export const EXAMPLE_CSV = `playerNumber,name,gender,level,levelDescription,requireConfirmInfo,phone
1,John Smith,MALE,3,"Intermediate player",true,0123456789
2,Jane Doe,FEMALE,5,"Advanced player",false,0987654321
3,Bob Wilson,MALE,1,"Beginner",true,0111222333
4,Alice Brown,FEMALE,4,"High Intermediate",false,0444555666`;
