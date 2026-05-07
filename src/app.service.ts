import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { message: string } {
    return { message: 'Hello from NestJS' };
  }

  add(num1: number, num2: number): { result: number } {
    return { result: num1 + num2 };
  }
}
