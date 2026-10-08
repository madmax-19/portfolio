/* =========================================================
   YADUNAND PORTFOLIO SCRIPT
========================================================= */

const $ = selector =>
    document.querySelector(selector);

const $$ = selector =>
    document.querySelectorAll(selector);


/* =========================================================
   CUSTOM CURSOR
========================================================= */

const cursor =
    $(".cursor");

const cursorDot =
    $(".cursor-dot");


if (cursor && cursorDot) {

    window.addEventListener(
        "mousemove",
        event => {

            cursor.style.left =
                event.clientX + "px";

            cursor.style.top =
                event.clientY + "px";

            cursorDot.style.left =
                event.clientX + "px";

            cursorDot.style.top =
                event.clientY + "px";

        }
    );

}


/* =========================================================
   REVEAL ANIMATION
========================================================= */

const revealObserver =
    new IntersectionObserver(

        entries => {

            entries.forEach(
                entry => {

                    if (
                        entry.isIntersecting
                    ) {

                        entry.target
                            .classList
                            .add("visible");

                    }

                }
            );

        },

        {
            threshold:0.1
        }

    );


$$(".reveal").forEach(
    element => {

        revealObserver.observe(
            element
        );

    }
);


/* =========================================================
   THEME
========================================================= */

const theme =
    $("#theme");


if (theme) {

    theme.onclick = () => {

        document.body
            .classList
            .toggle("light");

        theme.textContent =
            document.body.classList.contains(
                "light"
            )
                ? "☀"
                : "◐";

    };

}


/* =========================================================
   MOBILE MENU
========================================================= */

const menu =
    $("#menu");

const links =
    $(".links");


if (menu && links) {

    menu.onclick = () => {

        links.classList.toggle(
            "open"
        );

    };


    $$(".links a").forEach(
        link => {

            link.onclick = () => {

                links.classList.remove(
                    "open"
                );

            };

        }
    );

}


/* =========================================================
   PROJECT MODAL
========================================================= */

const modal =
    $("#modal");

const modalTitle =
    $("#modalTitle");

const modalDesc =
    $("#modalDesc");

const modalTech =
    $("#modalTech");


if (modal) {

    $$(".work-card").forEach(
        card => {

            const button =
                card.querySelector(
                    ".open-project"
                );


            if (
                button &&
                button.tagName !== "A"
            ) {

                button.onclick = () => {

                    if (modalTitle) {

                        modalTitle.textContent =
                            card.dataset.title ||
                            "";

                    }

                    if (modalDesc) {

                        modalDesc.textContent =
                            card.dataset.desc ||
                            "";

                    }

                    if (modalTech) {

                        modalTech.textContent =
                            card.dataset.tech ||
                            "";

                    }

                    modal.classList.add(
                        "show"
                    );

                };

            }

        }
    );

}


const closeModal =
    $("#close");


if (
    closeModal &&
    modal
) {

    closeModal.onclick = () => {

        modal.classList.remove(
            "show"
        );

    };

}


if (modal) {

    modal.onclick =
        event => {

            if (
                event.target ===
                modal
            ) {

                modal.classList.remove(
                    "show"
                );

            }

        };

}


/* =========================================================
   COPY CODE
========================================================= */

const copyButton =
    $("#copyCode");


if (copyButton) {

    copyButton.addEventListener(
        "click",
        async () => {

            const code =
                $("#codeBlock");


            if (!code) return;


            try {

                await navigator
                    .clipboard
                    .writeText(
                        code.innerText
                    );

                copyButton.textContent =
                    "Copied ✓";


                setTimeout(
                    () => {

                        copyButton.textContent =
                            "Copy code";

                    },
                    1500
                );

            }

            catch {

                copyButton.textContent =
                    "Select & copy";

            }

        }
    );

}
