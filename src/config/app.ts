interface AppConfig {
    name: string,
    github: {
        title: string,
        url: string
    },
    author: {
        name: string,
        url: string
    },
}

export const appConfig: AppConfig = {
    name: "Sample App",
    github: {
        title: "profit3",
        url: "https://github.com/mikerhodesideas/profit",
    },
    author: {
        name: "mikerhodesideas",
        url: "https://github.com/mikerhodesideas/",
    }
}