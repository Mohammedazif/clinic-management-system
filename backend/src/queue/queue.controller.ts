import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QueueService } from './queue.service';
import { CreateQueueItemDto } from './dto/create-queue-item.dto';
import { UpdateQueueItemDto } from './dto/update-queue-item.dto';
import { QueueStatus, QueuePriority } from '../entities/queue-item.entity';

@Controller('queue')
@UseGuards(AuthGuard('jwt'))
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post()
  async create(@Body() createQueueItemDto: CreateQueueItemDto) {
    return this.queueService.create(createQueueItemDto);
  }

  @Get()
  async findAll(
    @Query('status') status?: QueueStatus,
    @Query('doctorId') doctorId?: string,
    @Query('priority') priority?: QueuePriority,
    @Query('activeOnly') activeOnly?: string,
  ) {
    const filters = {
      status,
      doctorId,
      priority,
      activeOnly: activeOnly === 'true',
    };

    return this.queueService.findAll(filters);
  }

  @Get('stats')
  async getStats() {
    return this.queueService.getQueueStats();
  }

  @Get('active')
  async getActiveQueue() {
    return this.queueService.getActiveQueue();
  }

  @Get('waiting')
  async getWaitingQueue() {
    return this.queueService.getWaitingQueue();
  }

  @Get('number/:queueNumber')
  async findByQueueNumber(@Param('queueNumber') queueNumber: string) {
    return this.queueService.findByQueueNumber(parseInt(queueNumber));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.queueService.findOne(id);
  }

  @Post('call-next')
  async callNext(@Body() body: { doctorId?: string }) {
    return this.queueService.callNext(body.doctorId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateQueueItemDto: UpdateQueueItemDto) {
    return this.queueService.update(id, updateQueueItemDto);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: QueueStatus }) {
    return this.queueService.updateStatus(id, body.status);
  }

  @Patch(':id/assign-doctor')
  async assignDoctor(@Param('id') id: string, @Body() body: { doctorId: string }) {
    return this.queueService.assignDoctor(id, body.doctorId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.queueService.remove(id);
    return { message: 'Queue item deleted successfully' };
  }
}
