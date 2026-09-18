-- Public editorial Music Blog, isolated from the listen-exchange reward system.
create table public.music_blog_tracks (
  id uuid primary key default gen_random_uuid(),
  spotify_track_id text not null unique,
  title text not null,
  artist_name text not null,
  cover_url text,
  genres text[] not null,
  published boolean not null default false,
  display_order integer not null default 0,
  nb_listens integer not null default 0,
  nb_likes integer not null default 0,
  published_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint music_blog_tracks_spotify_id_check
    check (spotify_track_id ~ '^[A-Za-z0-9]{22}$'),
  constraint music_blog_tracks_title_check
    check (char_length(btrim(title)) between 1 and 500),
  constraint music_blog_tracks_artist_check
    check (char_length(btrim(artist_name)) between 1 and 300),
  constraint music_blog_tracks_cover_url_check
    check (cover_url is null or cover_url ~ '^https://'),
  constraint music_blog_tracks_genres_count_check
    check (cardinality(genres) between 1 and 3),
  constraint music_blog_tracks_genres_values_check
    check (
      genres <@ array[
        'Pop', 'Hip-Hop / Rap', 'Electronic', 'R&B / Soul', 'Rock',
        'Latin', 'Afrobeats', 'Country', 'Folk', 'Jazz', 'Classical',
        'Other'
      ]::text[]
      and array_position(genres, null) is null
    ),
  constraint music_blog_tracks_display_order_check
    check (display_order >= 0),
  constraint music_blog_tracks_listens_check
    check (nb_listens >= 0),
  constraint music_blog_tracks_likes_check
    check (nb_likes >= 0)
);

create table public.music_blog_likes (
  track_id uuid not null
    references public.music_blog_tracks(id) on delete cascade,
  user_id uuid not null
    references auth.users(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  primary key (track_id, user_id)
);

create index music_blog_tracks_published_order_idx
  on public.music_blog_tracks (display_order, id)
  where published = true;

create index music_blog_likes_user_track_idx
  on public.music_blog_likes (user_id, track_id);

alter table public.music_blog_tracks enable row level security;
alter table public.music_blog_likes enable row level security;

revoke all on table public.music_blog_tracks from public, anon, authenticated;
revoke all on table public.music_blog_likes from public, anon, authenticated;

grant select on table public.music_blog_tracks to anon, authenticated;
grant insert, update, delete on table public.music_blog_tracks to authenticated;
grant select on table public.music_blog_likes to authenticated;
grant select, insert, update, delete on table public.music_blog_tracks
  to service_role;
grant select, insert, update, delete on table public.music_blog_likes
  to service_role;

create policy "Published music blog tracks are public"
on public.music_blog_tracks
for select
to anon
using (published = true);

create policy "Authenticated users can read published music blog tracks"
on public.music_blog_tracks
for select
to authenticated
using (
  published = true
  or (select public.has_role('superadmin'::public.app_role))
);

create policy "Superadmins can add music blog tracks"
on public.music_blog_tracks
for insert
to authenticated
with check ((select public.has_role('superadmin'::public.app_role)));

create policy "Superadmins can update music blog tracks"
on public.music_blog_tracks
for update
to authenticated
using ((select public.has_role('superadmin'::public.app_role)))
with check ((select public.has_role('superadmin'::public.app_role)));

create policy "Superadmins can delete music blog tracks"
on public.music_blog_tracks
for delete
to authenticated
using ((select public.has_role('superadmin'::public.app_role)));

create policy "Users can read their own music blog likes"
on public.music_blog_likes
for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.toggle_music_blog_like(p_track_id uuid)
returns table (
  success boolean,
  liked boolean,
  nb_likes integer,
  message text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_likes integer;
begin
  if v_user_id is null then
    return query select false, false, 0, 'Sign in to like this track.'::text;
    return;
  end if;

  select t.nb_likes
  into v_likes
  from public.music_blog_tracks as t
  where t.id = p_track_id
    and t.published = true
  for update;

  if not found then
    return query select false, false, 0, 'Track not found.'::text;
    return;
  end if;

  delete from public.music_blog_likes as l
  where l.track_id = p_track_id
    and l.user_id = v_user_id;

  if found then
    update public.music_blog_tracks as t
    set nb_likes = greatest(0, t.nb_likes - 1),
        updated_at = clock_timestamp()
    where t.id = p_track_id
    returning t.nb_likes into v_likes;

    return query select true, false, v_likes, 'Like removed.'::text;
    return;
  end if;

  insert into public.music_blog_likes (track_id, user_id)
  values (p_track_id, v_user_id);

  update public.music_blog_tracks as t
  set nb_likes = t.nb_likes + 1,
      updated_at = clock_timestamp()
  where t.id = p_track_id
  returning t.nb_likes into v_likes;

  return query select true, true, v_likes, 'Track liked.'::text;
end;
$$;

revoke all on function public.toggle_music_blog_like(uuid)
  from public, anon;
grant execute on function public.toggle_music_blog_like(uuid)
  to authenticated, service_role;

insert into public.music_blog_tracks (
  spotify_track_id,
  title,
  artist_name,
  cover_url,
  genres,
  published,
  display_order,
  nb_listens,
  nb_likes,
  published_at,
  created_at
)
values
  ('2uuoUoMFtkLUxu1JUdfVo7', 'Back Row', 'Prima Queen', 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e021d39570afb48c9c7c34b017a', array['Pop', 'Rock'], true, 10, 67, 19, now() - interval '29 days', now() - interval '29 days'),
  ('0ltYgFjVpuCtjrgpmb737Z', 'Equinox', 'Snazzback', 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e020b1c94a2e572a08632a7c9fa', array['Jazz', 'Electronic'], true, 20, 42, 13, now() - interval '28 days', now() - interval '28 days'),
  ('1oWcOzDppr7S5fekLGMkcr', 'This Is The Day', 'Mamas Gun', 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02db574aabbe883bdfa48021f7', array['R&B / Soul', 'Pop'], true, 30, 89, 31, now() - interval '27 days', now() - interval '27 days'),
  ('7DorV3ChDdaiaBViOjG8IB', 'Goodnight Bobby', 'Blue Bendy', 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e0229d4a778e34d5b4dd186bf87', array['Rock'], true, 40, 35, 9, now() - interval '26 days', now() - interval '26 days'),
  ('5BjsreDPVHSd0CkPluD5rZ', 'No Ordinary Love', 'deary', 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02630499e1569aabfdcaca3eb5', array['Pop', 'Other'], true, 50, 54, 16, now() - interval '25 days', now() - interval '25 days'),
  ('1TKtSvSbTMjyaGMkSJWzaM', 'All roads lead to London', 'Jockstrap', 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02e734dcbdff57bb5e81f7cd19', array['Electronic', 'Other'], true, 60, 73, 24, now() - interval '24 days', now() - interval '24 days'),
  ('17j8RpXtHCRUZmKExDimjI', 'A Reason to Celebrate', 'bdrmm', 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e022f3019afe738a580f962d109', array['Rock', 'Electronic'], true, 70, 61, 18, now() - interval '23 days', now() - interval '23 days'),
  ('4b9oR0if2hOpScwqhBumTc', 'Every Single Day', 'Melt Yourself Down', 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e0234d28c827b3cc7fb8517764b', array['Jazz', 'Electronic'], true, 80, 48, 14, now() - interval '22 days', now() - interval '22 days'),
  ('2eWJ5AXFjRMANgyH6NbBfw', 'Reservoir', 'Brown Horse', 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02ac08253bb6939ea7ba0a8010', array['Folk', 'Country'], true, 90, 27, 7, now() - interval '21 days', now() - interval '21 days'),
  ('4PrSiHudgJKTaGAk3xdSqg', 'Original Sin', 'The New Eves', 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e025b2547995121ec9234daba27', array['Folk', 'Other'], true, 100, 39, 11, now() - interval '20 days', now() - interval '20 days'),
  ('2EvgPhMAwKEE83WGU6iXMK', 'Water water', 'The Deep Blue', 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e022ba6f7de1e7270573feebd8a', array['Folk', 'Pop'], true, 110, 58, 20, now() - interval '19 days', now() - interval '19 days'),
  ('41aB8zL0YEqnxWZYcZBMxH', 'projections', 'Night Tapes', 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02eca984ea873e091a34084016', array['Electronic', 'Pop'], true, 120, 82, 29, now() - interval '18 days', now() - interval '18 days'),
  ('6ba0WD7l1DZtA5FTGDdyhe', 'Boss Trick', 'Real Lies', 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02ba23de8057830cd19771f035', array['Electronic'], true, 130, 46, 12, now() - interval '17 days', now() - interval '17 days'),
  ('0PdezPqME7lbrXf5Lj73Zw', 'Kim', 'PVA', 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e029bce8f70b05c5a8a1dce0b6a', array['Electronic', 'Rock'], true, 140, 76, 27, now() - interval '16 days', now() - interval '16 days'),
  ('1FbhygaxdtRWi7W42LKQST', 'a w w', 'Mermaid Chunky', 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e028ab7a555a904bc683fe9c867', array['Electronic', 'Other'], true, 150, 33, 10, now() - interval '15 days', now() - interval '15 days'),
  ('7wzPXtglUGRIC49XOcGSJQ', 'TOOTHSKIN', 'Monster Florence', 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02ace073a7bc0d264865ab7b03', array['Hip-Hop / Rap', 'Rock'], true, 160, 70, 21, now() - interval '14 days', now() - interval '14 days'),
  ('3REh3rlmhnnmf9RI82EO1p', 'Eucalyptus', 'The Silhouettes Project', 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02efa954e513c1bee3e8c74121', array['Hip-Hop / Rap'], true, 170, 64, 23, now() - interval '13 days', now() - interval '13 days'),
  ('6zEqtQ5IOVTV7Q55NQ6YQm', 'R.L.M', 'MRCY', 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02fd56503c81962586fd566c88', array['R&B / Soul'], true, 180, 51, 17, now() - interval '12 days', now() - interval '12 days'),
  ('2zWT5nc1zo8xdX0pkN9eL3', 'Swimming up River', 'Babeheaven', 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e024c87373d534ebce495adac68', array['R&B / Soul', 'Pop'], true, 190, 44, 13, now() - interval '11 days', now() - interval '11 days'),
  ('1V6lKcSXiuFdqZEoKH0CIz', 'M11', 'oreglo', 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02115b8e487196138e688db877', array['Jazz'], true, 200, 30, 8, now() - interval '10 days', now() - interval '10 days'),
  ('2u6lMgXSzMJUZNXXgSENr0', 'Chandler', 'Ebi Soda', 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02a615adc5f16e59c964ba78a0', array['Jazz'], true, 210, 25, 7, now() - interval '9 days', now() - interval '9 days'),
  ('20RgsB6OPTtmYVR0guIL6M', 'Little One', 'Mammal Hands', 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e025c186d8981667d995ad7b805', array['Jazz', 'Other'], true, 220, 38, 11, now() - interval '8 days', now() - interval '8 days'),
  ('1BRlnV1Am5NkzHpp5dAXBj', 'Keeper', 'Nubiyan Twist', 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02ea089881c07f911b6a1771ec', array['Jazz', 'Afrobeats'], true, 230, 85, 30, now() - interval '7 days', now() - interval '7 days'),
  ('2cwKVrLex4P6rt80YuPjhV', 'Hot Sensation', 'The Allergies', 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02a98a368a002f2c3a923d49b4', array['R&B / Soul', 'Hip-Hop / Rap'], true, 240, 69, 22, now() - interval '6 days', now() - interval '6 days'),
  ('24tUf62XijtWQEJwQBBsKv', '4096 Colours', 'Portico Quartet', 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e025be277f8088af91c50da0f2c', array['Jazz', 'Electronic'], true, 250, 55, 18, now() - interval '5 days', now() - interval '5 days'),
  ('3aAByAhCAkqPMNNDA88My3', 'At the Top of the Hill, They Stood...', 'Penguin Cafe', 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02d2679452301bc777ba8eb04a', array['Classical', 'Other'], true, 260, 41, 12, now() - interval '4 days', now() - interval '4 days'),
  ('10yVj9AY4zBQnq8gZBXx8j', 'High On Nothing', 'Gentleman''s Dub Club', 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02a0a325614beae5fd2d0afd10', array['Electronic', 'Other'], true, 270, 60, 20, now() - interval '3 days', now() - interval '3 days'),
  ('00Ask4gOLP8zPwa1uZgNt0', 'Las Panteras', 'Los Bitchos', 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e0275666ce02b3eca39e15c6805', array['Latin', 'Other'], true, 280, 78, 26, now() - interval '2 days', now() - interval '2 days'),
  ('1yJZrbFgGQb3bo0i7B9oTY', 'Siege Lord', 'Heriot', 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e0220728f9f4ea80167f53a739b', array['Rock', 'Other'], true, 290, 22, 6, now() - interval '1 day', now() - interval '1 day'),
  ('2KserekRefyIM72DRj1v4q', 'Momentary Actuality', 'Pupil Slicer', 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02a666e4f0bba2e2103da5ffb3', array['Rock', 'Other'], true, 300, 36, 10, now(), now());
