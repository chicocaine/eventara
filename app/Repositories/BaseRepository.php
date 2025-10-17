<?php

namespace App\Repositories;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Collection;

abstract class BaseRepository
{
    protected Model $model;

    /**
     * Find a model by its primary key.
     *
     * @param mixed $id
     * @param array $relations
     * @return Model|null
     */
    public function find($id, array $relations = []): ?Model
    {
        $query = $this->model->newQuery();
        
        if (!empty($relations)) {
            $query->with($relations);
        }
        
        return $query->find($id);
    }

    /**
     * Find a model by its primary key or throw an exception.
     *
     * @param mixed $id
     * @param array $relations
     * @return Model
     */
    public function findOrFail($id, array $relations = []): Model
    {
        $query = $this->model->newQuery();
        
        if (!empty($relations)) {
            $query->with($relations);
        }
        
        return $query->findOrFail($id);
    }

    /**
     * Get all models.
     *
     * @param array $relations
     * @return Collection
     */
    public function all(array $relations = []): Collection
    {
        $query = $this->model->newQuery();
        
        if (!empty($relations)) {
            $query->with($relations);
        }
        
        return $query->get();
    }

    /**
     * Create a new model.
     *
     * @param array $data
     * @return Model
     */
    public function create(array $data): Model
    {
        return $this->model->create($data);
    }

    /**
     * Update a model.
     *
     * @param Model $model
     * @param array $data
     * @return bool
     */
    public function update(Model $model, array $data): bool
    {
        return $model->update($data);
    }

    /**
     * Delete a model.
     *
     * @param Model $model
     * @return bool|null
     */
    public function delete(Model $model): ?bool
    {
        return $model->delete();
    }

    /**
     * Find a model by specific field.
     *
     * @param string $field
     * @param mixed $value
     * @param array $relations
     * @return Model|null
     */
    public function findBy(string $field, $value, array $relations = []): ?Model
    {
        $query = $this->model->newQuery();
        
        if (!empty($relations)) {
            $query->with($relations);
        }
        
        return $query->where($field, $value)->first();
    }

    /**
     * Find all models by specific field.
     *
     * @param string $field
     * @param mixed $value
     * @param array $relations
     * @return Collection
     */
    public function findAllBy(string $field, $value, array $relations = []): Collection
    {
        $query = $this->model->newQuery();
        
        if (!empty($relations)) {
            $query->with($relations);
        }
        
        return $query->where($field, $value)->get();
    }
}
