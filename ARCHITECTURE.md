# Eventara - Layered Architecture Documentation

## Overview

This Laravel application follows a **layered architecture** pattern to ensure proper separation of concerns, maintainability, and testability. The codebase is organized into distinct layers, each with specific responsibilities.

## Architecture Layers

### 1. **Presentation Layer** (Controllers)
Located in: `app/Http/Controllers/`

**Responsibility**: Handle HTTP requests and responses, coordinate between services, and format API responses.

**What Controllers Should Do**:
- Validate HTTP requests (using Form Requests when complex)
- Call appropriate service methods
- Transform service responses into HTTP responses
- Handle authentication/authorization checks
- Return JSON responses with appropriate HTTP status codes

**What Controllers Should NOT Do**:
- Perform business logic
- Directly query the database
- Manipulate models directly
- Contain complex algorithms

**Example**:
```php
// Good ✅
public function updateProfile(Request $request): JsonResponse
{
    $user = Auth::user();
    try {
        $profile = $this->profileService->updateProfile($user, $request->all());
        return response()->json([
            'success' => true,
            'profile' => $this->profileService->transformProfileToArray($profile)
        ]);
    } catch (ValidationException $e) {
        return response()->json(['errors' => $e->errors()], 422);
    }
}

// Bad ❌
public function updateProfile(Request $request): JsonResponse
{
    $user = Auth::user();
    $profile = UserProfile::where('user_id', $user->user_id)->first();
    $profile->update($request->all()); // Direct model manipulation
    return response()->json(['profile' => $profile]);
}
```

### 2. **Service Layer** (Business Logic)
Located in: `app/Services/`

**Responsibility**: Implement business logic, orchestrate operations, validate business rules, and coordinate between repositories.

**What Services Should Do**:
- Implement business logic and rules
- Validate business constraints
- Orchestrate complex operations involving multiple repositories
- Transform data between layers
- Log important business events
- Throw meaningful exceptions

**What Services Should NOT Do**:
- Handle HTTP requests/responses
- Directly build database queries
- Access models directly (use repositories instead)

**Key Services**:
- `ProfileService` - Profile management business logic
- `UserEventService` - Event registration and management
- `UserManagementService` - Admin user management operations
- `AuthService` - Authentication logic
- `CertifikaService` - NFT/blockchain integration

**Example**:
```php
// ProfileService
public function updateProfile(UserAuth $user, array $data): UserProfile
{
    $profile = $this->getUserProfile($user);
    $validatedData = $this->validateProfileData($data, $profile->id);
    $updateData = $this->prepareUpdateData($validatedData);
    
    if (!$this->profileRepository->update($profile, $updateData)) {
        throw new \Exception('Failed to update profile.');
    }
    
    Log::info('Profile updated', ['user_id' => $user->user_id]);
    $profile->refresh();
    return $profile;
}
```

### 3. **Repository Layer** (Data Access)
Located in: `app/Repositories/`

**Responsibility**: Abstract database operations and provide a clean API for data access.

**What Repositories Should Do**:
- Encapsulate all database queries
- Provide methods for CRUD operations
- Handle Eloquent relationships
- Provide query optimization (eager loading, etc.)
- Return Eloquent models or collections

**What Repositories Should NOT Do**:
- Contain business logic
- Validate data (beyond query constraints)
- Transform data for presentation
- Log business events

**Key Repositories**:
- `BaseRepository` - Common CRUD operations
- `UserRepository` - User-specific queries
- `ProfileRepository` - Profile data access
- `EventRepository` - Event queries
- `UserEventRepository` - User-event registration queries

**Example**:
```php
// UserRepository
public function getPaginatedUsers(array $filters, int $perPage = 15): LengthAwarePaginator
{
    $query = $this->model->newQuery()->with(['profile', 'role']);
    
    if (!empty($filters['search'])) {
        $query->where(function (Builder $q) use ($filters) {
            $q->where('email', 'ILIKE', "%{$filters['search']}%")
              ->orWhereHas('profile', function (Builder $profileQuery) use ($filters) {
                  $profileQuery->where('first_name', 'ILIKE', "%{$filters['search']}%");
              });
        });
    }
    
    return $query->paginate($perPage);
}
```

### 4. **Model Layer** (Domain Models)
Located in: `app/Models/`

**Responsibility**: Define database structure, relationships, and model-specific logic.

**What Models Should Do**:
- Define fillable/guarded attributes
- Define relationships (hasMany, belongsTo, etc.)
- Define attribute casts
- Contain model-specific helper methods
- Define scopes for common queries
- Handle model events (observers)

**What Models Should NOT Do**:
- Contain complex business logic
- Handle validation
- Contain data transformation logic

**Example**:
```php
class UserProfile extends Model
{
    protected $fillable = ['alias', 'first_name', 'last_name', ...];
    protected $casts = ['preferences' => 'array', 'links' => 'array'];
    
    // Good: Simple computed property
    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }
    
    // Good: Relationship definition
    public function user(): BelongsTo
    {
        return $this->belongsTo(UserAuth::class, 'user_id');
    }
}
```

## Data Flow

```
HTTP Request
    ↓
[Controller] ← Validates request, authenticates user
    ↓
[Service] ← Applies business logic, validates rules
    ↓
[Repository] ← Builds queries, accesses database
    ↓
[Model] ← Represents database entities
    ↓
[Repository] → Returns models/collections
    ↓
[Service] → Transforms data, logs events
    ↓
[Controller] → Formats HTTP response
    ↓
HTTP Response
```

## Dependency Injection

All services and repositories are registered in `AppServiceProvider` as singletons for optimal performance:

```php
// app/Providers/AppServiceProvider.php
public function register(): void
{
    $this->app->singleton(ProfileService::class, function ($app) {
        return new ProfileService($app->make(ProfileRepository::class));
    });
    
    $this->app->singleton(UserEventService::class, function ($app) {
        return new UserEventService(
            $app->make(UserEventRepository::class),
            $app->make(EventRepository::class)
        );
    });
}
```

Controllers receive dependencies via constructor injection:

```php
class ProfileController extends Controller
{
    protected ProfileService $profileService;

    public function __construct(ProfileService $profileService)
    {
        $this->profileService = $profileService;
    }
}
```

## Benefits of This Architecture

### 1. **Separation of Concerns**
Each layer has a single, well-defined responsibility:
- Controllers handle HTTP
- Services handle business logic
- Repositories handle data access
- Models represent entities

### 2. **Testability**
- Services can be tested independently with mocked repositories
- Repositories can be tested with test databases
- Controllers can be tested with mocked services

### 3. **Maintainability**
- Changes to business logic only affect services
- Database query changes only affect repositories
- Easy to locate and modify specific functionality

### 4. **Reusability**
- Services can be used by multiple controllers
- Repositories can be used by multiple services
- Business logic isn't duplicated

### 5. **Flexibility**
- Easy to swap implementations (e.g., different data sources)
- Can add caching at the repository layer
- Can add logging/monitoring at any layer

## Design Patterns Used

### 1. **Repository Pattern**
Abstracts data access logic from business logic.

### 2. **Service Layer Pattern**
Encapsulates business logic in dedicated service classes.

### 3. **Dependency Injection**
Components receive their dependencies rather than creating them.

### 4. **Single Responsibility Principle**
Each class has one reason to change.

### 5. **Data Transfer Objects (Implicit)**
Data is transformed at each layer boundary.

## Code Organization

```
app/
├── Http/
│   └── Controllers/           # Presentation Layer
│       ├── Controller.php
│       ├── Admin/
│       │   └── UserManagementController.php
│       ├── Auth/
│       │   ├── AuthController.php
│       │   └── ...
│       └── User/
│           ├── ProfileController.php
│           └── UserEventController.php
│
├── Services/                  # Business Logic Layer
│   ├── ProfileService.php
│   ├── UserEventService.php
│   ├── UserManagementService.php
│   ├── AuthService.php
│   └── ...
│
├── Repositories/              # Data Access Layer
│   ├── BaseRepository.php
│   ├── UserRepository.php
│   ├── ProfileRepository.php
│   ├── EventRepository.php
│   └── UserEventRepository.php
│
├── Models/                    # Domain Layer
│   ├── UserAuth.php
│   ├── UserProfile.php
│   ├── Event.php
│   ├── UserEvent.php
│   └── ...
│
└── Providers/
    └── AppServiceProvider.php # Dependency Injection Container
```

## Best Practices

### 1. **Always Use Type Hints**
```php
public function updateProfile(UserAuth $user, array $data): UserProfile
```

### 2. **Use Exceptions for Error Handling**
```php
if (!$profile) {
    throw new \Exception('Profile not found.');
}
```

### 3. **Log Important Events**
```php
Log::info('Profile updated', ['user_id' => $user->user_id]);
```

### 4. **Keep Methods Focused**
Each method should do one thing well.

### 5. **Use Meaningful Names**
```php
// Good
getUserRegistrations()
// Bad
get()
```

### 6. **Return Consistent Data Types**
Don't mix return types (Model vs array vs null).

### 7. **Validate at the Right Layer**
- HTTP validation in controllers
- Business rule validation in services
- Database constraints in migrations

## Migration Guide

When adding new features, follow this pattern:

1. **Create/Update Model** (if needed)
   - Define fillable attributes
   - Add relationships
   - Add casts

2. **Create/Update Repository**
   - Add query methods
   - Handle complex database operations

3. **Create/Update Service**
   - Implement business logic
   - Call repository methods
   - Add validation

4. **Create/Update Controller**
   - Handle HTTP requests
   - Call service methods
   - Return responses

5. **Register in AppServiceProvider** (if new)
   - Bind repository
   - Bind service

## Testing Strategy

### Unit Tests
- Test services with mocked repositories
- Test repositories with test database
- Test models for relationships and accessors

### Feature Tests
- Test controllers with mocked services
- Test full HTTP request/response cycle

### Integration Tests
- Test complete workflows across all layers

## Conclusion

This layered architecture provides a solid foundation for building and maintaining a complex Laravel application. By adhering to these principles and patterns, the codebase remains clean, testable, and scalable.
