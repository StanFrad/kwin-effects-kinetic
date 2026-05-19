/*
    This file is part of the KDE project.

    SPDX-FileCopyrightText: 2018 Vlad Zahorodnii <vlad.zahorodnii@kde.org>

    SPDX-License-Identifier: GPL-2.0-or-later
*/

"use strict";

function interpolateRect(src, tgt, t) {
    return {
        x: (1 - t) * src.x + t * tgt.x,
        y: (1 - t) * src.y + t * tgt.y,
        width: (1 - t) * src.width + t * tgt.width,
        height: (1 - t) * src.height + t * tgt.height,
    };
}

class SquashEffect {
    constructor() {
        effects.windowAdded.connect(this.slotWindowAdded.bind(this));
        for (const window of effects.stackingOrder) {
            this.slotWindowAdded(window);
        }
    }

    slotWindowMinimized(window) {
        if (effects.hasActiveFullScreenEffect) {
            return;
        }

        // If the window doesn't have an icon in the task manager,
        // don't animate it.
        const iconRect = window.iconGeometry;
        if (!iconRect || iconRect.width === 0 || iconRect.height === 0) {
            return;
        }

        if (window.unminimizeAnimation) {
            cancel(window.unminimizeAnimation);
            delete window.unminimizeAnimation;
        }

        if (window.minimizeAnimation) {
            cancel(window.minimizeAnimation);
        }

        const sourceRect = window.geometry;
        // Validate geometry to prevent division by zero
        if (!sourceRect || sourceRect.width === 0 || sourceRect.height === 0) {
            return;
        }
        const targetRect = interpolateRect(sourceRect, window.iconGeometry, 0.15);
        const sclx = targetRect.width / sourceRect.width;
        const scly = targetRect.height / sourceRect.height;
        const scl = (sclx < scly) ? sclx : scly;

        window.minimizeAnimation = animate({
            window: window,
            duration: animationTime(100),
            animations: [
                {
                    type: Effect.Scale,
                    from: 1,
                    to: scl,
                    curve: QEasingCurve.Linear
                },
                {
                    type: Effect.Opacity,
                    from: 1,
                    to: 0.2,
                    curve: QEasingCurve.Linear
                },
                {
                    type: Effect.Translation,
                    from: {
                        value1: 0,
                        value2: 0
                    },
                    to: {
                        value1: -(sourceRect.x + sourceRect.width / 2 - targetRect.x - targetRect.width / 2),
                        value2: -(sourceRect.y + sourceRect.height / 2 - targetRect.y - targetRect.height / 2)
                    },
                    curve: QEasingCurve.Linear
                },
            ]
        });
    }

    slotWindowUnminimized(window) {
        if (effects.hasActiveFullScreenEffect) {
            return;
        }

        // If the window doesn't have an icon in the task manager,
        // don't animate it.
        const iconRect = window.iconGeometry;
        if (!iconRect || iconRect.width === 0 || iconRect.height === 0) {
            return;
        }

        if (window.minimizeAnimation) {
            cancel(window.minimizeAnimation);
            delete window.minimizeAnimation;
        }

        if (window.unminimizeAnimation) {
            cancel(window.unminimizeAnimation);
        }

        const sourceRect = window.geometry;
        // Validate geometry to prevent division by zero
        if (!sourceRect || sourceRect.width === 0 || sourceRect.height === 0) {
            return;
        }
        const snappyness = 0.4;
        const targetRect = interpolateRect(sourceRect, window.iconGeometry, snappyness);
        const sclx = targetRect.width / sourceRect.width;
        const scly = targetRect.height / sourceRect.height;
        const scl = (sclx < scly) ? sclx : scly;

        window.unminimizeAnimation = animate({
            window: window,
            duration: animationTime(317),
            animations: [
                {
                    type: Effect.Scale,
                    from: scl,
                    to: 1,
                    curve: QEasingCurve.OutExpo
                },
                {
                    type: Effect.Translation,
                    from: {
                        value1: -(sourceRect.x + sourceRect.width / 2 - targetRect.x - targetRect.width / 2),
                        value2: -(sourceRect.y + sourceRect.height / 2 - targetRect.y - targetRect.height / 2)
                    },
                    to: {
                        value1: 0,
                        value2: 0
                    },
                    curve: QEasingCurve.OutExpo
                },
                {
                    type: Effect.Opacity,
                    from: 0.0,
                    to: 1.0,
                    curve: QEasingCurve.OutExpo
                }
            ]
        });
    }

    slotWindowAdded(window) {
        window.minimizedChanged.connect(() => {
            if (window.minimized) {
                this.slotWindowMinimized(window);
            } else {
                this.slotWindowUnminimized(window);
            }
        });
    }
}

new SquashEffect();
