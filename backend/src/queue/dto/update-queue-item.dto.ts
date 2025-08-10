import { PartialType } from '@nestjs/mapped-types';
import { CreateQueueItemDto } from './create-queue-item.dto';

export class UpdateQueueItemDto extends PartialType(CreateQueueItemDto) {}
