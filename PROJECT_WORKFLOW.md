# Yangon Bus Bot Code Workflow

This project is a NestJS Telegram bot. Its job is simple:

1. Receive a message from Telegram.
2. Remember what the user is trying to do.
3. Query bus data from PostgreSQL.
4. Send a useful reply back to Telegram.

The project uses three main NestJS feature areas:

- `TelegramModule`: receives Telegram webhook messages and controls the chat flow.
- `BusModule`: reads bus, stop, township, and route data from the database.
- `SessionModule`: remembers each Telegram user's current conversation state.

## Big Picture

The app starts in `main.ts`.

`main.ts` creates the Nest app from `AppModule`, then starts the HTTP server on `PORT` or `3000`.

`AppModule` is the root module. It wires together:

- `ConfigModule` for environment variables.
- `TypeOrmModule` for PostgreSQL connection.
- the entity classes used by TypeORM.
- the app feature modules: Telegram, Bus, and Session.

So the high-level runtime flow is:

```text
Telegram -> POST /telegram/webhook -> TelegramController -> TelegramService
                                                     |
                                                     v
                               TelegramService routes the message
                                                     |
                                                     v
                         TelegramHandler performs the bot action
                                                     |
                                                     v
                                  BusService queries PostgreSQL
                                                     |
                                                     v
                              TelegramKeyboard sends Telegram reply
```

## Database Entities

Entities are TypeORM classes. They describe database tables and relationships.

### `Township`

File: `src/entities/township.entity.ts`

Represents a township in Yangon.

Important fields:

- `id`: primary key.
- `name`: township name, unique.
- `stops`: one township can have many bus stops.

Relationship:

```text
Township 1 -> many Stops
```

### `Stop`

File: `src/entities/stop.entity.ts`

Represents a bus stop.

Important fields:

- `id`: primary key.
- `name`: stop name.
- `township`: the township this stop belongs to.
- `busLineStops`: route entries connected to this stop.

Relationship:

```text
Stop many -> 1 Township
Stop 1 -> many BusLineStop
```

### `BusLine`

File: `src/entities/bus-line.entity.ts`

Represents a bus line, for example `4`, `7`, or `43B`.

Important fields:

- `id`: primary key.
- `number`: bus line number, unique.
- `description`: optional route description.
- `busLineStops`: the ordered stops for this bus line.

Relationship:

```text
BusLine 1 -> many BusLineStop
```

### `BusLineStop`

File: `src/entities/bus-line-stop.entity.ts`

This is the join table between bus lines and stops.

It exists because:

- one bus line has many stops
- one stop can belong to many bus lines
- each stop has an order within a bus line

Important fields:

- `busLine`: the bus line.
- `stop`: the stop.
- `stopOrder`: the position of that stop on the route.

Relationship:

```text
BusLine -> BusLineStop -> Stop
```

Example:

```text
Bus 43
1. Stop A
2. Stop B
3. Stop C
```

Each row in `bus_line_stops` stores one stop for one bus line with its order.

### `Session`

File: `src/entities/session.entity.ts`

Stores each Telegram user's conversation state.

Important fields:

- `telegramId`: Telegram user id.
- `state`: what the bot is currently waiting for.
- `tempData`: temporary data used between messages.
- `updatedAt`: automatically updated timestamp.

Example states:

- `IDLE`: user is at the main menu.
- `WAITING_BUS_NUMBER`: bot is waiting for a bus number.
- `WAITING_STOP_NAME`: bot is waiting for a stop name.
- `WAITING_STOP_CHOICE`: bot found multiple stops and is waiting for the user to choose one.

This is important because Telegram messages are stateless by default. Without `Session`, the bot would not know whether the next message is a bus number, a stop name, or a menu command.

## Modules

NestJS modules group related code.

### `BusModule`

File: `src/bus/bus.module.ts`

Registers the repositories needed by `BusService`.

It imports:

- `BusLineStop`
- `Stop`

It exports `BusService` so other modules, especially `TelegramModule`, can use it.

### `SessionModule`

File: `src/session/session.module.ts`

Registers the `Session` repository and provides `SessionService`.

It exports `SessionService` so Telegram code can remember each user's state.

### `TelegramModule`

File: `src/telegram/telegram.module.ts`

Connects Telegram-related code.

It imports:

- `SessionModule`
- `BusModule`

That gives the Telegram providers access to conversation state and bus lookup logic.

In the current structure, Telegram work is split into three providers:

- `TelegramService`: receives updates, checks navigation commands, and routes by session state.
- `TelegramHandler`: performs the actual bot actions, such as searching bus lines or stops.
- `TelegramKeyboard`: sends messages and shows/removes Telegram keyboard buttons.

This split is useful because each class has a smaller job.

## Services

Services contain business logic.

Controllers should stay thin. In this project, the controller receives the HTTP request and passes it to the service. The real decision-making happens in services.

## `TelegramController`

File: `src/telegram/telegram.controller.ts`

This controller exposes:

```text
POST /telegram/webhook
```

Telegram sends bot updates to this endpoint.

Step by step:

1. Receive the request body from Telegram.
2. Call `telegramService.handleUpdate(body)`.
3. Return `{ ok: true }`.

It does not parse commands or query the database. That is good NestJS style: controllers receive requests, services handle behavior.

## `TelegramService`

File: `src/telegram/telegram.service.ts`

This service is the router for Telegram updates.

It does not directly query bus data and it does not directly call the Telegram API anymore. Instead, it decides what should happen next and delegates the action to `TelegramHandler`.

### `handleUpdate(body)`

Entry point for every Telegram update.

Step by step:

1. Check whether the update is an inline button callback.
2. If it is a callback, route it to `handleCallbackUpdate(...)`.
3. If not, check whether the update is a text message.
4. Extract:
   - Telegram user id
   - chat id
   - message text
5. Load or create the user's session.
6. Check whether the message is a navigation command.
7. If not, route the message based on the user's current session state.

This function is the traffic controller for the bot.

### `handleCallbackUpdate(body)`

Handles inline button clicks from the menu message.

Inline buttons do not send normal text messages. Telegram sends a `callback_query` update instead. That is why this project has separate callback handling.

Step by step:

1. Extract the Telegram user id, chat id, callback id, and callback data.
2. Create the user's session if needed.
3. Answer the callback query so Telegram stops showing the loading spinner.
4. If the user clicked bus-line search, set state to `WAITING_BUS_NUMBER`.
5. If the user clicked stop-name search, set state to `WAITING_STOP_NAME`.
6. Ask the user to type the next input.

### `handleNavigation(chatId, telegramId, text)`

Handles commands/buttons that should work from anywhere.

Examples:

- `/start`
- `🔙 ပင်မစာမျက်နှာပြန်သွားရန်`
- `🚌 ယာဥ်လိုင်းနံပါတ်ဖြင့် ရှာရန်`
- `🚏 မှတ်တိုင်ဖြင့်ရှာရန်`
- old English keyboard labels, for compatibility with older Telegram clients

This function prevents a common bot bug: treating button text as normal user input.

For example, if the bot is waiting for a bus number and the user taps the bus-line search button again, the bot should restart that flow instead of searching for a bus whose number is the button text.

Step by step:

1. If the user asks for the main menu, reset state to `IDLE` and show the menu.
2. If the user chooses bus-line search, set state to `WAITING_BUS_NUMBER`.
3. If the user chooses stop-name search, set state to `WAITING_STOP_NAME`.
4. Remove any old input-box keyboard when asking for typed input.

### `isTelegramTextUpdate(body)`

Checks that the incoming Telegram payload is actually a text message before the bot tries to read `message.text`, `message.from.id`, or `message.chat.id`.

This is a TypeScript type guard. It protects the app from non-text Telegram updates, such as stickers and photos.

### `isTelegramCallbackUpdate(body)`

Checks that the incoming Telegram payload is an inline button callback before the bot tries to read `callback_query.data`.

This lets the bot support buttons under the message.

## `TelegramHandler`

File: `src/telegram/telegram.handler.ts`

This class contains the bot conversation actions.

If `TelegramService` answers "which branch of the conversation are we in?", then `TelegramHandler` answers "what do we do for that branch?"

### `handleIdle(chatId)`

Runs when the user has no active task.

It shows the main menu by calling `TelegramKeyboard.showMainMenu(chatId)`.

This is the default safe behavior: if the bot does not know what the user wants, show options.

### `askForBusNumber(chatId)`

Runs when the user chooses bus-line search.

Step by step:

1. Send a Burmese prompt asking for the bus line number.
2. Remove any old input-box keyboard so the user types a real bus number.

### `askForStopName(chatId)`

Runs when the user chooses stop-name search.

Step by step:

1. Send a Burmese prompt asking for the stop name.
2. Remove any old input-box keyboard so the user types a real stop name.

### `handleBusNumberInput(chatId, telegramId, text)`

Runs when the bot is waiting for a bus number.

Step by step:

1. Call `BusService.getStopsByBusNumber(text)`.
2. If no stops are found, tell the user in Burmese that the bus line was not found.
3. If stops are found, format them in route order.
4. Send the list back to Telegram.
5. Reset the user's session state to `IDLE`.
6. Show the main menu again.

### `handleStopNameInput(chatId, telegramId, text)`

Runs when the bot is waiting for a stop name.

Step by step:

1. Call `BusService.searchStops(text)`.
2. If no stops are found, ask the user in Burmese to try again.
3. If exactly one stop is found, show buses for that stop.
4. If multiple stops are found, show a numbered list.
5. Store the possible choices in `Session.tempData`.
6. Set state to `WAITING_STOP_CHOICE`.

The multiple-choice step matters because different townships can have stops with similar or identical names.

### `handleStopChoice(chatId, telegramId, text, tempData)`

Runs when the bot has shown multiple stops and is waiting for the user to choose one.

Step by step:

1. Check whether `tempData` still contains valid stop choices.
2. Convert the user's message to a number.
3. Validate that the number is within range.
4. Pick the selected stop.
5. Call `showBusesForStop(...)`.

If the session data is missing or stale, the bot resets to the main menu instead of crashing.

### `showBusesForStop(chatId, telegramId, stop)`

Shows all bus lines that pass through a selected stop.

Step by step:

1. Call `BusService.getBusesByStop(stop.id)`.
2. If no buses are found, tell the user.
3. If buses are found, format the bus numbers and descriptions.
4. Send the result.
5. Reset session state to `IDLE`.
6. Show the main menu.

## `TelegramKeyboard`

File: `src/telegram/telegram.keyboard.ts`

This class owns Telegram API message sending and keyboard markup.

Keeping this separate is a nice design choice: the handler can focus on bot logic, while this class handles Telegram-specific message details.

### `TELEGRAM_KEYBOARD_TEXT`

Stores the keyboard button labels in one place.

Current Burmese labels:

- `🚌 ယာဥ်လိုင်းနံပါတ်ဖြင့် ရှာရန်`
- `🚏 မှတ်တိုင်ဖြင့်ရှာရန်`
- `🔙 ပင်မစာမျက်နှာပြန်သွားရန်`

It also keeps old English labels:

- `🚌 Search by Bus Line`
- `🚏 Search by Stop Name`

Those old labels matter because Telegram clients can still show an old keyboard until `/start` refreshes the menu.

### `TELEGRAM_CALLBACK_DATA`

Stores callback values for inline menu buttons.

Current callback values:

- `SEARCH_BY_BUS_LINE`
- `SEARCH_BY_STOP_NAME`

These values are not shown to the user. Telegram sends them back to the bot when the user clicks an inline button.

### `showMainMenu(chatId)`

Sends the main menu with Burmese inline buttons under the message.

The menu currently has two options:

- Search by bus line number.
- Search by stop name.

After sending the inline menu, it also sends a small message with `remove_keyboard: true`. This clears any old reply keyboard under the input box.

The current design intentionally does not show persistent buttons under the input box. The menu buttons live under the message, which keeps the chat cleaner.

### `sendMessage(chatId, text, replyMarkup)`

Sends a message to Telegram using Axios.

Step by step:

1. Build the Telegram API request.
2. Send `chat_id`, `text`, and optional keyboard markup.
3. Catch Telegram API errors.
4. Log a short warning instead of crashing the request.

This is important because Telegram may reject messages for normal reasons, such as:

- user has not started the bot
- chat id is wrong
- bot was removed from a chat

The bot should not crash just because one message cannot be sent.

### `removeKeyboard(chatId, text)`

Sends a message and removes the Telegram custom keyboard.

This is used when the bot needs typed input, like a bus number or a stop name, and when the main menu wants to clear older reply keyboards.

### `answerCallbackQuery(callbackQueryId)`

Acknowledges an inline button click.

Telegram clients show a loading spinner after an inline button is clicked. Calling `answerCallbackQuery` tells Telegram, "The bot received the click."

## `BusService`

File: `src/bus/bus.service.ts`

This service owns bus-related database queries.

### `getStopsByBusNumber(busNumber)`

Finds all stops for a bus line.

Step by step:

1. Search `BusLineStop` rows where the related bus line has the given number.
2. Load related data:
   - bus line
   - stop
   - stop township
3. Sort by `stopOrder`.
4. Return the ordered route.

Used by:

```text
TelegramHandler.handleBusNumberInput()
```

### `searchStops(name)`

Searches stops by partial name.

Step by step:

1. Start a query on the `Stop` table.
2. Join the related township.
3. Use PostgreSQL `ILIKE` for case-insensitive partial matching.
4. Return all matching stops.

Used by:

```text
TelegramHandler.handleStopNameInput()
```

### `getBusesByStop(stopId)`

Finds all bus lines passing through a specific stop.

Step by step:

1. Search `BusLineStop` rows where the related stop has the given id.
2. Load related bus line, stop, and township.
3. Sort by `stopOrder`.
4. Return matching route entries.

Used by:

```text
TelegramHandler.showBusesForStop()
```

## `SessionService`

File: `src/session/session.service.ts`

This service owns conversation state.

### `getOrCreate(telegramId)`

Gets the user's existing session or creates a new one.

Step by step:

1. Search for a session by `telegramId`.
2. If found, return it.
3. If not found, create a new session with:
   - state `IDLE`
   - `tempData` as `null`
4. Save it.
5. Return the session.

### `setState(telegramId, state)`

Changes the user's state.

It also clears `tempData`, because old temporary choices should not leak into a new flow.

Example:

```text
WAITING_STOP_CHOICE -> IDLE
```

### `setTempData(telegramId, data)`

Stores temporary data for the next message.

Example:

If the user searches for a stop and the bot finds three possible stops, those three choices are saved in `tempData`. Then when the user replies `1`, `2`, or `3`, the bot knows which stop they meant.

## Conversation Examples

### Search By Bus Line

```text
User: /start
Bot: shows menu with inline buttons under the message

User: clicks 🚌 ယာဥ်လိုင်းနံပါတ်ဖြင့် ရှာရန်
Bot: Enter bus line number
Session state: WAITING_BUS_NUMBER

User: 43
Bot: queries route stops for bus 43
Bot: sends ordered stop list
Session state: IDLE
Bot: shows menu
```

### Search By Stop Name

```text
User: clicks 🚏 မှတ်တိုင်ဖြင့်ရှာရန်
Bot: Enter stop name
Session state: WAITING_STOP_NAME

User: Hledan
Bot: searches matching stops
```

If one stop is found:

```text
Bot: shows buses passing that stop
Session state: IDLE
```

If multiple stops are found:

```text
Bot: shows numbered choices
Session state: WAITING_STOP_CHOICE

User: 2
Bot: shows buses passing selected stop
Session state: IDLE
```

## Why Session State Matters

Telegram does not automatically remember conversations for your app.

Every webhook request is just one message. So the app needs to store state like:

```text
This user clicked "Search by Bus Line" or "ယာဥ်လိုင်းနံပါတ်ဖြင့် ရှာရန်".
The next message should be treated as a bus number.
```

That is what the `sessions` table does.

Without session state, the bot would not know the difference between:

```text
User: 43
```

Meaning:

- bus line `43`
- stop name `43`
- menu choice `43`
- invalid message

State gives the message context.

## Important NestJS Concepts In This Project

### Module

A module groups related providers/controllers.

Example:

```text
TelegramModule = TelegramController + TelegramService + TelegramHandler + TelegramKeyboard + imported dependencies
```

### Controller

A controller handles incoming HTTP routes.

Example:

```text
POST /telegram/webhook
```

### Service

A service contains business logic.

Example:

```text
TelegramService routes incoming Telegram updates.
TelegramHandler decides what reply/action to perform.
TelegramKeyboard sends Telegram messages and keyboards.
BusService queries bus data.
SessionService stores chat state.
```

### Provider Injection

NestJS gives classes their dependencies through constructors.

Example:

```ts
constructor(
  private readonly sessionService: SessionService,
  private readonly handler: TelegramHandler,
) {}
```

This means `TelegramService` does not manually create `SessionService` or `TelegramHandler`. Nest creates and injects them.

### Repository

TypeORM repositories are used to read and write database tables.

Example:

```ts
@InjectRepository(Session)
private readonly sessionRepo: Repository<Session>
```

This gives `SessionService` access to the `sessions` table.

## Things To Improve Later

This project is good for learning, but a production bot would usually improve these areas:

- Replace `synchronize: true` with migrations.
- Add real seed data for townships, stops, and bus routes.
- Add stronger tests for Telegram conversation flows.
- Validate required environment variables on startup.
- Move Telegram API calls into a small client class.
- Avoid storing large objects in session `tempData`.
- Add pagination if a stop search returns many results.

## Mental Model

Think of the bot like a receptionist.

`TelegramController` opens the door.

`TelegramService` asks, "What are you trying to do?"

`SessionService` remembers the current conversation.

`TelegramHandler` performs the selected bot action.

`BusService` looks up the answer.

`TelegramKeyboard` replies to the user.

That is the main workflow of the app.
