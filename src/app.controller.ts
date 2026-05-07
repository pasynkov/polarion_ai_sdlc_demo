import { Controller, Get, Query, ParseFloatPipe } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): { message: string } {
    return this.appService.getHello();
  }

  @Get('add')
  add(
    @Query('num1', ParseFloatPipe) num1: number,
    @Query('num2', ParseFloatPipe) num2: number,
  ): { result: number } {
    return this.appService.add(num1, num2);
  }

  @Get('sub')
  sub(
    @Query('num1', ParseFloatPipe) num1: number,
    @Query('num2', ParseFloatPipe) num2: number,
  ): { result: number } {
    return this.appService.subtract(num1, num2);
  }
}
