<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',          // <- important pour /api/...
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // middlewares globaux ici si besoin
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // gestion des exceptions ici si besoin
    })
    ->create();   // <- C'EST ÇA QUI MANQUAIT
