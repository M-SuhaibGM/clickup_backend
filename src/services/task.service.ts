// backend/src/services/task.service.ts
import { TaskModel } from '../models/task.model';
import { ListModel } from '../models/list.model';

const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
const VALID_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

export const TaskService = {
  listByList(listId: string, ownerId: string) {
    return TaskModel.findAllByList(listId, ownerId);
  },

  getOne(id: string, ownerId: string) {
    return TaskModel.findByIdAndOwner(id, ownerId);
  },

  async create(listId: string, ownerId: string, input: any) {
    if (!input.title?.trim()) throw new Error('Task title is required');

    // Verify list belongs to this owner before creating a task in it
    const list = await ListModel.findByIdAndOwner(listId, ownerId);
    if (!list) throw new Error('List not found or not owned by you');

    const data: any = {
      title: input.title.trim(),
      description: input.description?.trim(),
    };

    if (input.status) {
      if (!VALID_STATUSES.includes(input.status)) throw new Error('Invalid status');
      data.status = input.status;
    }
    if (input.priority) {
      if (!VALID_PRIORITIES.includes(input.priority)) throw new Error('Invalid priority');
      data.priority = input.priority;
    }
    if (input.dueDate) data.dueDate = new Date(input.dueDate);
    if (input.assigneeId) data.assigneeId = input.assigneeId;

    // Pass ownerId to model
    return TaskModel.create(listId, ownerId, data);
  },

  async update(id: string, ownerId: string, input: any) {
    // ... (data building logic stays exactly the same) ...

    const data: any = {};
    if (input.title !== undefined) {
      if (!input.title.trim()) throw new Error('Title cannot be empty');
      data.title = input.title.trim();
    }
    if (input.description !== undefined) data.description = input.description?.trim() ?? null;
    if (input.status !== undefined) {
      if (!VALID_STATUSES.includes(input.status)) throw new Error('Invalid status');
      data.status = input.status;
    }
    if (input.priority !== undefined) {
      if (!VALID_PRIORITIES.includes(input.priority)) throw new Error('Invalid priority');
      data.priority = input.priority;
    }
    if (input.dueDate !== undefined) {
      data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    }
    if (input.assigneeId !== undefined) data.assigneeId = input.assigneeId || null;

    const result = await TaskModel.update(id, ownerId, data);
    if (result.count === 0) throw new Error('Task not found or not owned by you');

    return TaskModel.findByIdAndOwner(id, ownerId);
  },

  async delete(id: string, ownerId: string) {
    const result = await TaskModel.delete(id, ownerId);
    if (result.count === 0) throw new Error('Task not found or not owned by you');
  },

  async reorder(taskIds: string[], ownerId: string) {
    return TaskModel.reorder(taskIds, ownerId);
  },
};