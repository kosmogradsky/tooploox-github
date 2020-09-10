import * as React from "react";
import { render } from "react-dom";

interface ResRepo {
  id: string | number;
  html_url: string;
  name: string;
  stargazers_count: number;
}

interface Repo {
  id: string | number;
  name: string;
  url: string;
}

interface UserVisitor<T> {
  visitUser(user: User): T;
  visitNotFound(): T;
  visitNothing(): T;
}

class User {
  constructor(
    readonly avatarUrl: string,
    readonly name: string,
    readonly bio: string
  ) {}

  accept<T>(visitor: UserVisitor<T>): T {
    return visitor.visitUser(this);
  }
}

class NotFound {
  constructor() {}

  accept<T>(visitor: UserVisitor<T>): T {
    return visitor.visitNotFound();
  }
}

class Nothing {
  constructor() {}

  accept<T>(visitor: UserVisitor<T>): T {
    return visitor.visitNothing();
  }
}

class UserRenderVisitor implements UserVisitor<React.ReactNode> {
  visitUser(user: User) {
    return (
      <>
        <img className="user-avatar" src={user.avatarUrl} alt="" />
        <div className="user-name">{user.name}</div>
        <div className="user-bio">{user.bio}</div>
      </>
    );
  }

  visitNotFound() {
    return <div className="warning-message">User not found.</div>;
  }

  visitNothing() {
    return (
      <div className="warning-message">You haven't made any requests yet.</div>
    );
  }
}

class ReposRenderVisitor implements UserVisitor<React.ReactNode> {
  constructor(readonly repos: Repo[]) {}

  visitUser() {
    return (
      <>
        <div className="repo-section-title">Top repositories</div>
        {this.repos.map((repo) => (
          <a className="repo-link" key={repo.id} href={repo.url}>
            {repo.name}
          </a>
        ))}
      </>
    );
  }

  visitNotFound() {
    return null;
  }

  visitNothing() {
    return null;
  }
}

const userRenderVisitor = new UserRenderVisitor();

interface AppState {
  user: User | NotFound | Nothing;
  repos: Repo[];
}

class App extends React.Component<{}, AppState> {
  state: AppState = {
    user: new Nothing(),
    repos: [],
  };

  fetchUser(username: string) {
    fetch(`https://api.github.com/users/${username}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.message === "Not Found") {
          this.setState({
            user: new NotFound(),
          });

          return null;
        }

        this.setState({
          user: new User(res.avatar_url, res.name, res.bio),
        });

        return this.fetchRepos(res.repos_url);
      });
  }

  fetchRepos(reposUrl: string) {
    return fetch(reposUrl)
      .then((res) => res.json())
      .then((res: ResRepo[]) => {
        const repos = res
          .slice()
          .sort((a, b) => b.stargazers_count - a.stargazers_count)
          .map(
            (repo): Repo => ({
              id: repo.id,
              name: repo.name,
              url: repo.html_url,
            })
          )
          .slice(0, 3);

        this.setState({ repos });
      });
  }

  submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.target as HTMLFormElement);

    this.fetchUser(formData.get("search-term") as string);
  }

  render() {
    return (
      <>
        <form
          className="search-form"
          action=""
          onSubmit={(e) => this.submitForm(e)}
        >
          <div className="search-input-container">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15.5893 14.4127L11.2367 10.06C13.3063 7.33945 12.7786 3.45627 10.058 1.38666C7.33745 -0.682932 3.45427 -0.155226 1.38466 2.56533C-0.684931 5.28588 -0.157224 9.16906 2.56333 11.2387C4.7776 12.9231 7.84371 12.9231 10.058 11.2387L14.4107 15.5913C14.7385 15.9111 15.2615 15.9111 15.5893 15.5913C15.9145 15.2657 15.9145 14.7383 15.5893 14.4127ZM1.83333 6.33333V6.33333C1.83333 3.84805 3.84805 1.83333 6.33333 1.83333C8.81861 1.83333 10.8333 3.84805 10.8333 6.33333C10.8333 8.81861 8.81861 10.8333 6.33333 10.8333C3.84927 10.8304 1.83627 8.81739 1.83333 6.33333L1.83333 6.33333Z"
                fill="#4F4F4F"
              />
            </svg>
            <input
              className="search-input"
              type="text"
              name="search-term"
              placeholder="Search for users"
            />
          </div>
          <button className="search-button">Search</button>
        </form>
        <section className="user-section">
          {this.state.user.accept(userRenderVisitor)}
          {this.state.user.accept(new ReposRenderVisitor(this.state.repos))}
        </section>
      </>
    );
  }
}

render(<App />, document.getElementById("app"));
