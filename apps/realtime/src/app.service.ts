import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      service: 'tahaddi-realtime',
      status: 'ok',
    } as const;
  }
}
