# Lichess to Chess.com Review

A browser extension that takes a finished Lichess game and opens it on Chess.com, ready for Game Review.

## Lichess side

**Game id**:
The 8-character public identifier of a Lichess game. It is safe to show, log and send.
_Avoid_: game code, game URL

**Full id**:
The 12-character form of a Lichess game id: the game id followed by a 4-character secret token for one player. It is a credential, so it is always truncated to the game id and never kept.
_Avoid_: game id (when 12 characters are meant), player link

**Export**:
Getting a game's PGN out of Lichess.
_Avoid_: download, fetch, scrape

## The extension

**Refusal**:
The extension's explicit statement to the user that it will not open the current page or link, and why. A refusal is a designed outcome, never silence and never an error.
_Avoid_: error, failure, unsupported

## Chess.com side

**Import**:
Handing a PGN to Chess.com by navigating to its analysis board. On its own it saves nothing on Chess.com.
_Avoid_: upload, save, send

**Analysis board**:
The Chess.com page an import lands on, showing the game ready for the user to start Game Review.
_Avoid_: analysis page, review page

**Game Review**:
Chess.com's engine review of a game (accuracy, move classifications, commentary). The user starts it from the analysis board, and free accounts are limited to a daily quota.
_Avoid_: Report, analysis, review (bare)

**Persisted analysis**:
The saved copy of a game Chess.com creates when the user starts Game Review. Anyone with its link can read it.
_Avoid_: saved game, import (for the saved copy)
