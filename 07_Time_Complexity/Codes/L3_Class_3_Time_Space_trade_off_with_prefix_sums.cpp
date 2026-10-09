#include <iostream>
using namespace std;

int main() {
    int arr[6] = {3, 1, 4, 1, 5, 9};
    int n = 6;
    int l = 1, r = 4;

    // Way 1: no extra memory, loop over the range every time -> O(N) per query
    int sum1 = 0, steps1 = 0;
    for (int i = l; i <= r; i++) {
        sum1 += arr[i];
        steps1++;
    }

    // Way 2: build prefix[] once (O(N) extra space), then each query is O(1)
    int prefix[7];
    prefix[0] = 0;
    for (int i = 0; i < n; i++) {
        prefix[i + 1] = prefix[i] + arr[i];
    }
    int sum2 = prefix[r + 1] - prefix[l];

    cout << "Sum of arr[" << l << ".." << r << "]" << endl;
    cout << "Loop: " << sum1 << " in " << steps1 << " steps, O(1) extra space" << endl;
    cout << "Prefix: " << sum2 << " in 1 step, O(N) extra space" << endl;
    return 0;
}
