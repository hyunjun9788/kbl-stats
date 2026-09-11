import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { PlayersService, type PlayerListItem } from './players.service.js';

@Controller('players')
export class PlayersController {
  constructor(private readonly players: PlayersService) {}

  @Get()
  async list(@Query('season') season?: string): Promise<PlayerListItem[]> {
    const seasonCode = Number(season);
    if (!season || !Number.isInteger(seasonCode)) {
      throw new BadRequestException(
        'query param "season" (KBL season code, e.g. 47) is required',
      );
    }
    return this.players.listBySeason(seasonCode);
  }
}
