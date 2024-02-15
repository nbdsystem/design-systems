'use client';

import { designSystems } from '@nbds/design-systems';
import Link from 'next/link';
import { useState } from 'react';

export default function IndexPage() {
  const [query, setQuery] = useState('');
  const results =
    query !== ''
      ? designSystems.filter((designSystem) => {
          return designSystem.name.toLowerCase().includes(query);
        })
      : designSystems;
  return (
    <>
      <main className="p-4 flex flex-col gap-y-4">
        <h1 className="text-2xl font-bold">
          Design systems ({designSystems.length})
        </h1>
        <div>
          <form>
            <div className="flex flex-col">
              <label htmlFor="search-input">Find a design system</label>
              <input
                aria-describedby="search-input-desc"
                className="border border-black"
                id="search-input"
                type="text"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value.toLowerCase());
                }}
              />
              <p id="search-input-desc">
                Design systems will be filtered as you type
              </p>
            </div>
          </form>
        </div>
        <h2 className="text-xl font-semibold">
          Results
          <div className="text-sm font-normal">
            {results.length === 0
              ? 'No results found'
              : `${results.length} results found`}
          </div>
        </h2>
        <div className="flex flex-col gap-y-6">
          {results.map((designSystem) => {
            return (
              <section key={designSystem.name}>
                <h3 className="text-lg font-semibold">{designSystem.name}</h3>
                <p>{designSystem.company}</p>
                <ul role="list">
                  {designSystem.links.map((link) => {
                    return (
                      <li key={link.url} role="listitem">
                        <Link
                          className="text-blue-600 underline"
                          href={link.url}
                          rel="noopener noreferrer"
                          target="_blank">
                          {link.url}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </main>
    </>
  );
}
